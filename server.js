const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const ffmpegBinary = process.platform === 'win32' ? ffmpegStatic : 'ffmpeg';
const { GoogleGenAI } = require('@google/genai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Create required directories
const dirs = ['downloads', 'clips', 'exports', 'public'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Configure Multer for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'downloads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `upload_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Serve static assets
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.use('/clips', express.static(path.join(__dirname, 'clips')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Fallback to index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper: Initialize Gemini SDK
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set it in the Settings panel.');
  }
  return new GoogleGenAI({ apiKey });
}

// Helper: Run FFmpeg Command
function runFFmpeg(args, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`Running FFmpeg: ${ffmpegBinary} ${args.join(' ')}`);
    
    // Inject Fontconfig config file to resolve Windows fonts rendering only on Windows
    const env = { ...process.env };
    if (process.platform === 'win32') {
      env.FONTCONFIG_FILE = path.join(__dirname, 'fonts.conf');
    }

    const proc = spawn(ffmpegBinary, args, { cwd, env });
    
    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`FFmpeg error output:\n${stderr}`);
        reject(new Error(`FFmpeg exited with code ${code}. Error: ${stderr.slice(-200)}`));
      }
    });
  });
}

// Helper: Run Gemini content generation with model fallbacks and retry backoffs
async function generateContentWithFallback(ai, options) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  const maxRetries = 2;
  let lastError;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Calling generateContent using model ${model} (attempt ${attempt + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          ...options,
          model: model
        });
        return response;
      } catch (err) {
        lastError = err;
        console.warn(`Error using model ${model} (attempt ${attempt + 1}):`, err.message);
        
        // Check if error is retryable (503 Unavailable, 429 Rate Limit, network errors)
        const errMsg = (err.message || '').toLowerCase();
        const isTemporary = errMsg.includes('503') || errMsg.includes('unavailable') || 
                            errMsg.includes('429') || errMsg.includes('rate') || 
                            errMsg.includes('limit') || errMsg.includes('demand');
                            
        if (!isTemporary || attempt === maxRetries) {
          break; // Stop retrying this model, proceed to fallback or exit
        }
        
        // Wait before retry (exponential backoff: 1.5s, 3s)
        const delay = Math.pow(2, attempt) * 1500;
        console.log(`Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    console.warn(`Model ${model} failed. Trying fallback model if available...`);
  }
  
  throw new Error(`Gemini API calls failed: ${lastError.message || lastError}`);
}

// ----------------------------------------------------
// 1. Settings Endpoints
// ----------------------------------------------------
app.get('/api/settings', (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({ configured: false });
  }
  const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****';
  res.json({ configured: true, keyMasked: masked });
});

app.post('/api/settings', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'API key is required.' });
  }

  process.env.GEMINI_API_KEY = apiKey.trim();
  
  // Save to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, `GEMINI_API_KEY=${apiKey.trim()}\n`);

  res.json({ success: true, message: 'Gemini API key saved successfully.' });
});

// ----------------------------------------------------
// 2. Video Import Endpoint
// ----------------------------------------------------
app.post('/api/import', upload.single('videoFile'), async (req, res) => {
  try {
    const { url } = req.body;
    let videoPath = '';
    let videoId = '';

    if (req.file) {
      // Local file upload
      videoPath = req.file.path;
      videoId = path.basename(req.file.filename, path.extname(req.file.filename));
    } else if (url) {
      // YouTube or direct link
      videoId = `yt_${Date.now()}`;
      videoPath = path.join(__dirname, 'downloads', `${videoId}.mp4`);

      console.log(`Downloading video from URL: ${url}`);
      await new Promise((resolve, reject) => {
        // Run yt-dlp to download best mp4
        const args = [
          '--ffmpeg-location', ffmpegBinary,
          '--no-check-certificate',
          '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          '--merge-output-format', 'mp4',
          '-o', videoPath,
          url
        ];

        console.log(`Running yt-dlp ${args.join(' ')}`);
        const proc = spawn('yt-dlp', args);
        
        let stderr = '';
        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`yt-dlp exited with code ${code}. Error: ${stderr.slice(-200)}`));
          }
        });
      });
    } else {
      return res.status(400).json({ error: 'Please provide either a video URL or a file upload.' });
    }

    // Extract Audio from the video (mono, 16kHz MP3 for optimal Gemini handling)
    const audioFilename = `audio_${videoId}.mp3`;
    const audioPath = path.join(__dirname, 'downloads', audioFilename);

    console.log(`Extracting audio to: ${audioPath}`);
    await runFFmpeg([
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ar', '16000',
      '-ac', '1',
      audioPath
    ]);

    const videoFilename = path.basename(videoPath);
    res.json({
      success: true,
      videoId,
      videoUrl: `/downloads/${videoFilename}`,
      audioUrl: `/downloads/${audioFilename}`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. Gemini Video Analysis Endpoint
// ----------------------------------------------------
app.post('/api/analyze', async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required.' });
  }

  const audioPath = path.join(__dirname, 'downloads', `audio_${videoId}.mp3`);
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ error: 'Audio file not found. Please re-import the video.' });
  }

  let uploadResult;
  try {
    const ai = getGeminiClient();

    console.log(`Uploading audio to Gemini Files API: ${audioPath}`);
    uploadResult = await ai.files.upload({
      file: audioPath,
      mimeType: 'audio/mp3',
    });

    console.log(`File uploaded: ${uploadResult.name}. Checking status...`);
    let fileState = await ai.files.get({ name: uploadResult.name });
    while (fileState.state === 'PROCESSING') {
      console.log('Waiting for file processing...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      fileState = await ai.files.get({ name: uploadResult.name });
    }

    if (fileState.state !== 'ACTIVE') {
      throw new Error(`File processing failed. State: ${fileState.state}`);
    }

    const prompt = `Analyze the audio of this video to identify the most engaging, viral, or interesting segments optimized specifically for YouTube Shorts, Instagram Reels, and TikTok.
Focus heavily on YT Shorts virality:
1. Identify segments that start with a powerful, high-impact hook in the first 1-3 seconds.
2. For each clip, the duration (end - start) MUST range between 30 and 90 seconds (i.e., at least 30 seconds and at most 90 seconds long). If the original video is shorter than 30 seconds, identify clips spanning the maximum possible duration.
3. For each clip, provide:
   - A catchy hook-focused Title.
   - Precise start and end times in seconds (as floats or integers).
   - A virality score from 0 to 100 based on hook strength, emotional engagement, and pacing.
   - A brief explanation of why this segment is viral (e.g., strong hook, clear takeaway, dramatic peak).
   - An optimized Description for YT Shorts including a hook line.
   - A list of 3 to 5 trending Hashtags (e.g., #shorts, etc.).

Return the response strictly in JSON format matching the schema.`;

    const response = await generateContentWithFallback(ai, {
      contents: [
        {
          fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            clips: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING' },
                  start: { type: 'NUMBER' },
                  end: { type: 'NUMBER' },
                  score: { type: 'INTEGER' },
                  reason: { type: 'STRING' },
                  description: { type: 'STRING' },
                  hashtags: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  }
                },
                required: ['title', 'start', 'end', 'score', 'reason', 'description', 'hashtags']
              }
            }
          },
          required: ['clips']
        }
      }
    });

    const result = JSON.parse(response.text);
    console.log('Analysis successful. Found clips:', result.clips.length);

    res.json({ success: true, clips: result.clips });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up file from Gemini cloud storage asynchronously
    if (uploadResult) {
      const ai = getGeminiClient();
      ai.files.delete({ name: uploadResult.name }).catch(err => {
        console.error('Failed to clean up Gemini file:', err.message);
      });
    }
  }
});

// ----------------------------------------------------
// 4. Video Slicing Endpoint
// ----------------------------------------------------
app.post('/api/cut', async (req, res) => {
  try {
    const { videoId, start, end } = req.body;
    if (!videoId || start === undefined || end === undefined) {
      return res.status(400).json({ error: 'videoId, start, and end parameters are required.' });
    }

    // Find the original video file
    const downloadsDir = path.join(__dirname, 'downloads');
    const files = fs.readdirSync(downloadsDir);
    const videoFile = files.find(f => f.startsWith(videoId) && !f.endsWith('.mp3'));
    if (!videoFile) {
      return res.status(404).json({ error: 'Original video file not found.' });
    }

    const videoPath = path.join(downloadsDir, videoFile);
    const duration = parseFloat(end) - parseFloat(start);
    const clipFilename = `clip_${videoId}_${start}_${end}.mp4`;
    const clipPath = path.join(__dirname, 'clips', clipFilename);

    console.log(`Slicing video from ${start}s for ${duration}s to ${clipPath}`);

    // Accurate-seek (-ss after -i) and re-encode audio/video to ensure smooth playback
    await runFFmpeg([
      '-y',
      '-i', videoPath,
      '-ss', start.toString(),
      '-t', duration.toString(),
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-avoid_negative_ts', 'make_zero',
      '-strict', '-2',
      clipPath
    ]);

    // Extract clip audio for transcription
    const clipAudioFilename = `clip_audio_${videoId}_${start}_${end}.mp3`;
    const clipAudioPath = path.join(__dirname, 'clips', clipAudioFilename);

    console.log(`Extracting clip audio for transcription: ${clipAudioPath}`);
    await runFFmpeg([
      '-y',
      '-i', clipPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ar', '16000',
      '-ac', '1',
      clipAudioPath
    ]);

    res.json({
      success: true,
      clipUrl: `/clips/${clipFilename}`,
      clipAudioUrl: `/clips/${clipAudioFilename}`,
      clipFilename,
      clipAudioFilename
    });

  } catch (error) {
    console.error('Cut error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. Word-level Caption Generation Endpoint
// ----------------------------------------------------
app.post('/api/captions', async (req, res) => {
  const { clipAudioFilename } = req.body;
  if (!clipAudioFilename) {
    return res.status(400).json({ error: 'clipAudioFilename is required.' });
  }

  const audioPath = path.join(__dirname, 'clips', clipAudioFilename);
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ error: 'Clip audio file not found.' });
  }

  try {
    const ai = getGeminiClient();
    console.log(`Reading clip audio for inline transcription: ${audioPath}`);
    const audioBase64 = fs.readFileSync(audioPath).toString('base64');

    console.log('Generating word-level captions inline...');
    const prompt = `Transcribe this audio file. Return a JSON array where each item represents a single word with its precise start and end times in seconds relative to the audio start. Keep the timestamps highly accurate. Do not skip any words.`;

    const response = await generateContentWithFallback(ai, {
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: 'audio/mp3'
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              word: { type: 'STRING' },
              start: { type: 'NUMBER' },
              end: { type: 'NUMBER' }
            },
            required: ['word', 'start', 'end']
          }
        }
      }
    });

    const captions = JSON.parse(response.text);
    console.log('Captions generated successfully. Total words:', captions.length);

    res.json({ success: true, captions });

  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. Subtitle Burn-In and Export Endpoint
// ----------------------------------------------------
app.post('/api/export', async (req, res) => {
  try {
    const { clipFilename, captions, style, crop } = req.body;
    if (!clipFilename || !captions || !Array.isArray(captions)) {
      return res.status(400).json({ error: 'clipFilename and captions array are required.' });
    }

    const clipPath = path.join(__dirname, 'clips', clipFilename);
    if (!fs.existsSync(clipPath)) {
      return res.status(404).json({ error: 'Clip file not found.' });
    }

    // Style specifications in ASS format (&H<A><B><G><R>)
    let primaryColor = '00FFFFFF'; // White
    let activeColor = '0000FFFF';  // Yellow (BGR)
    let outlineColor = '00000000'; // Black
    let fontSize = 28;
    let alignment = 2; // Bottom center
    let borderStyle = 1;
    let outline = 3;
    let shadow = 0;
    let fontName = 'Arial';

    if (style === 'cyberpunk') {
      primaryColor = '00FFFF00'; // Cyan
      activeColor = '00FF00FF';  // Hot Pink
      outlineColor = '00330033'; // Deep Violet Outline
      fontSize = 32;
      alignment = 5; // Middle center (classic for short video hooks)
      outline = 4;
      fontName = 'Impact';
    } else if (style === 'minimalist') {
      primaryColor = '00E0E0E0'; // Light grey
      activeColor = '00FFFFFF';  // Pure white
      outlineColor = '00222222';
      fontSize = 22;
      alignment = 2;
      outline = 1.5;
      fontName = 'Arial';
    } else {
      // Default / TikTok Yellow
      fontName = 'Arial';
      fontSize = 28;
      primaryColor = '00FFFFFF';
      activeColor = '0000FFFF';
      outlineColor = '00000000';
      outline = 3;
      alignment = 5; // Centered
    }

    // Group captions into short high-impact phrases for virality
    const phrases = [];
    let currentPhrase = [];
    const maxPhraseLength = (style === 'minimalist') ? 8 : 3;
    
    for (let i = 0; i < captions.length; i++) {
      const cap = captions[i];
      currentPhrase.push(cap);
      
      const wordText = cap.word.trim();
      const hasSentenceEnding = /[.!?]/.test(wordText);
      const hasClauseEnding = /[,;:-]/.test(wordText);
      
      const nextCap = captions[i + 1];
      const hasPause = nextCap ? (nextCap.start - cap.end > 0.6) : false;
      const isTooLong = currentPhrase.length >= maxPhraseLength;
      
      if (hasSentenceEnding || hasPause || isTooLong || !nextCap) {
        phrases.push(currentPhrase);
        currentPhrase = [];
      } else if (hasClauseEnding && currentPhrase.length >= 2) {
        phrases.push(currentPhrase);
        currentPhrase = [];
      }
    }
    if (currentPhrase.length > 0) {
      phrases.push(currentPhrase);
    }

    // Generate ASS dialogue events
    const formatTime = (sec) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const cs = Math.floor((sec % 1) * 100);
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    const dialogueEvents = [];
    for (const phrase of phrases) {
      for (let i = 0; i < phrase.length; i++) {
        const activeWord = phrase[i];
        const startSec = activeWord.start;
        // Make the word highlight transition perfectly to the next word
        const endSec = (i === phrase.length - 1) ? activeWord.end : phrase[i + 1].start;

        const styledWords = phrase.map((w, idx) => {
          if (idx === i) {
            return `{\\c&H${activeColor}&}${w.word}{\\c}`;
          }
          return w.word;
        });

        const text = styledWords.join(' ');
        dialogueEvents.push(`Dialogue: 0,${formatTime(startSec)},${formatTime(endSec)},Default,,0000,0000,0000,,${text}`);
      }
    }

    // ASS Content
    const assContent = `[Script Info]
Title: Clipper Styled Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},&H${primaryColor},&H${primaryColor},&H${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,${borderStyle},${outline},${shadow},${alignment},10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogueEvents.join('\n')}
`;

    // Save ASS file
    const assFilename = `subs_${Date.now()}.ass`;
    const assPath = path.join(__dirname, 'clips', assFilename);
    fs.writeFileSync(assPath, assContent, 'utf-8');

    // Build FFmpeg filters
    const exportFilename = `export_${Date.now()}.mp4`;
    const exportPath = path.join(__dirname, 'exports', exportFilename);

    let filterComplex = '';
    if (crop) {
      // Crop to 9:16 aspect ratio (center crop), then apply subtitles.
      // Under Windows FFmpeg subtitles filter, we want to specify relative path or escaped absolute path.
      // Setting Cwd of runFFmpeg to 'clips' directory allows using the filename directly!
      filterComplex = `crop=ih*9/16:ih,subtitles=${assFilename}`;
    } else {
      filterComplex = `subtitles=${assFilename}`;
    }

    console.log(`Running export with filter: ${filterComplex}`);
    
    // We execute runFFmpeg in the 'clips' directory so subtitles=filename works seamlessly
    // The input file is in 'clips/clipFilename' -> relative path is 'clipFilename'
    // The output file is in 'exports/exportFilename' -> relative path is '../exports/exportFilename'
    await runFFmpeg([
      '-y',
      '-i', clipFilename,
      '-vf', filterComplex,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-strict', '-2',
      `../exports/${exportFilename}`
    ], path.join(__dirname, 'clips'));

    // Clean up temporary ASS file
    fs.unlink(assPath, (err) => {
      if (err) console.error('Error deleting temp ASS file:', err);
    });

    res.json({
      success: true,
      exportUrl: `/exports/${exportFilename}`,
      exportFilename
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Clipper Server is running on port ${PORT}`);
  console.log(`  Access the app at http://localhost:${PORT}`);
  console.log(`=================================================`);
});
