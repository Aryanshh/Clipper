const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const { Readable } = require('stream');
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
const dirs = ['downloads', 'clips', 'exports', 'public', 'fonts'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Write cookies.txt from environment variable if configured (for Render/HuggingFace persistence)
if (process.env.YOUTUBE_COOKIES) {
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  try {
    fs.writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES, 'utf-8');
    console.log('Successfully initialized cookies.txt from environment variable.');
  } catch (err) {
    console.error('Failed to initialize cookies.txt from environment variable:', err);
  }
}

// Automatically update yt-dlp to the latest version on startup
console.log('Checking for yt-dlp updates...');
exec('yt-dlp -U', (err, stdout, stderr) => {
  if (err) {
    console.error('Failed to update yt-dlp:', err.message);
  } else {
    console.log('yt-dlp update check:', stdout.trim() || stderr.trim() || 'Already up to date');
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
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

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
    
    // Generate a dynamic fonts.conf with absolute paths to ensure font loading
    const dynamicFontsConf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
    <dir>${path.join(__dirname, 'fonts')}</dir>
    ${process.platform === 'win32' ? '<dir>C:\\Windows\\Fonts</dir>' : '<dir>/usr/share/fonts</dir><dir>/usr/local/share/fonts</dir>'}
    <cachedir>${path.join(__dirname, 'fontcache')}</cachedir>
</fontconfig>`;
    
    const fontsConfPath = path.join(__dirname, 'temp_fonts.conf');
    try {
      fs.writeFileSync(fontsConfPath, dynamicFontsConf, 'utf-8');
    } catch (err) {
      console.error('Failed to write temp_fonts.conf:', err);
    }

    const env = {
      ...process.env,
      FONTCONFIG_FILE: fontsConfPath
    };

    const proc = spawn(ffmpegBinary, args, { cwd, env });
    
    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      // Clean up temp fonts.conf
      fs.unlink(fontsConfPath, (err) => {
        if (err) console.error('Error deleting temp_fonts.conf:', err);
      });

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
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  const hasCookies = fs.existsSync(cookiesPath);
  
  let cookiesContent = '';
  if (hasCookies) {
    try {
      cookiesContent = fs.readFileSync(cookiesPath, 'utf-8');
    } catch (err) {
      console.error('Error reading cookies.txt:', err);
    }
  }

  if (!key) {
    return res.json({ configured: false, cookiesConfigured: hasCookies, cookiesContent });
  }
  const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****';
  res.json({ configured: true, keyMasked: masked, cookiesConfigured: hasCookies, cookiesContent });
});

app.post('/api/settings', (req, res) => {
  const { apiKey, youtubeCookies } = req.body;
  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'API key is required.' });
  }

  process.env.GEMINI_API_KEY = apiKey.trim();
  
  // Save to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, `GEMINI_API_KEY=${apiKey.trim()}\n`);

  // Save or delete cookies.txt
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  if (youtubeCookies && youtubeCookies.trim() !== '') {
    try {
      fs.writeFileSync(cookiesPath, youtubeCookies, 'utf-8');
      console.log('Saved YouTube cookies to cookies.txt');
    } catch (err) {
      console.error('Error saving cookies.txt:', err);
    }
  } else {
    if (fs.existsSync(cookiesPath)) {
      try {
        fs.unlinkSync(cookiesPath);
        console.log('Deleted cookies.txt');
      } catch (err) {
        console.error('Error deleting cookies.txt:', err);
      }
    }
  }

  res.json({ success: true, message: 'Settings saved successfully.' });
});

// Helper to extract YouTube video ID
function getYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Download YouTube video via public Invidious proxies to bypass data center blocks
async function downloadYoutubeViaInvidious(url, videoPath) {
  const videoId = getYoutubeId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  console.log(`Resolving Invidious instances for Video ID: ${videoId}`);
  
  let instances = [];
  try {
    const res = await fetch('https://api.invidious.io/instances.json');
    const data = await res.json();
    instances = data
      .filter(item => {
        const info = item[1];
        return info && info.type === 'https' && info.api === true && (!info.monitor || info.monitor.down === false);
      })
      .map(item => item[1].uri);
  } catch (err) {
    console.error('Failed to fetch dynamic Invidious instances:', err.message);
  }

  const staticFallback = [
    'https://invidious.yewtu.be',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://inv.thepixora.com',
    'https://invidious.privacydev.net'
  ];
  
  const allInstances = [...new Set([...instances, ...staticFallback])];
  console.log(`Found ${allInstances.length} Invidious mirrors. Attempting download...`);

  for (const instance of allInstances) {
    try {
      console.log(`Trying mirror: ${instance}`);
      const apiUri = `${instance}/api/v1/videos/${videoId}?local=true`;
      
      const res = await fetch(apiUri, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      
      const videoData = await res.json();
      let streamUrl = '';
      
      if (videoData.formatStreams && videoData.formatStreams.length > 0) {
        // Find 720p or 360p combined video+audio stream
        const bestStream = videoData.formatStreams.find(s => s.quality === 'hd720' || s.label === '720p') || 
                           videoData.formatStreams.find(s => s.quality === 'medium' || s.label === '360p') || 
                           videoData.formatStreams[0];
        streamUrl = bestStream.url;
      }
      
      if (!streamUrl && videoData.adaptiveFormats && videoData.adaptiveFormats.length > 0) {
        const videoStream = videoData.adaptiveFormats.find(s => s.type.startsWith('video/') && (s.qualityLabel === '720p' || s.qualityLabel === '360p')) || 
                            videoData.adaptiveFormats.find(s => s.type.startsWith('video/'));
        if (videoStream) {
          streamUrl = videoStream.url;
        }
      }

      if (!streamUrl) continue;

      if (streamUrl.startsWith('/')) {
        streamUrl = `${instance}${streamUrl}`;
      }

      console.log(`Downloading video stream from: ${streamUrl}`);
      const downloadRes = await fetch(streamUrl, { signal: AbortSignal.timeout(300000) });
      if (!downloadRes.ok) throw new Error(`Status ${downloadRes.status}`);

      const fileStream = fs.createWriteStream(videoPath);
      await new Promise((resolve, reject) => {
        const readable = Readable.fromWeb(downloadRes.body);
        readable.pipe(fileStream);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
        readable.on('error', reject);
      });

      console.log('Successfully downloaded video via Invidious mirror.');
      return;
    } catch (err) {
      console.warn(`Mirror ${instance} failed: ${err.message}`);
    }
  }

  throw new Error('All Invidious mirrors failed to download the video.');
}

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
      
      let downloadSuccessful = false;
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
          await downloadYoutubeViaInvidious(url, videoPath);
          downloadSuccessful = true;
        } catch (err) {
          console.warn(`Invidious download failed: ${err.message}. Falling back to yt-dlp...`);
        }
      }

      if (!downloadSuccessful) {
        await new Promise((resolve, reject) => {
          // Run yt-dlp to download best mp4
          const args = [
            '--no-check-certificate',
            '-f', 'bestvideo+bestaudio/best',
            '--merge-output-format', 'mp4',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--referer', 'https://www.youtube.com/',
            '--extractor-args', 'youtube:player_client=default,-android_sdkless',
            '-o', videoPath,
            url
          ];

          const localCookiesPath = path.join(__dirname, 'cookies.txt');
          if (fs.existsSync(localCookiesPath)) {
            args.unshift('--cookies', localCookiesPath);
          }

          if (process.platform === 'win32') {
            args.unshift('--ffmpeg-location', ffmpegBinary);
          }

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
      }
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
      '-crf', '18',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
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
    const { clipFilename, captions, style, crop, cropMode, font, title, description, hashtags } = req.body;
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

    // Override font if specified
    const fontMapping = {
      'the_bold_font': 'The Bold Font',
      'montserrat_black': 'Montserrat Black',
      'bangers': 'Bangers',
      'fredoka_one': 'Fredoka One',
      'impact': 'Impact',
      'arial': 'Arial'
    };
    if (font && fontMapping[font]) {
      fontName = fontMapping[font];
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

    const activeCropMode = cropMode || (crop ? 'crop' : 'original');
    let filterComplex = '';
    
    if (activeCropMode === 'crop') {
      // Crop to 9:16 aspect ratio (center crop), then apply subtitles.
      filterComplex = `crop=ih*9/16:ih,subtitles=${assFilename}`;
    } else if (activeCropMode === 'fit_blur') {
      // Fit video inside a 9:16 canvas, applying a blurred background behind it.
      filterComplex = `split=2[bg_src][fg_src];[bg_src]scale=ih*9/16:ih:force_original_aspect_ratio=increase,crop=ih*9/16:ih,boxblur=20:5[bg];[fg_src]scale=ih*9/16:-2[fg];[bg][fg]overlay=0:(main_h-overlay_h)/2,subtitles=${assFilename}`;
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
      '-crf', '18',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'high',
      '-level:v', '4.1',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-strict', '-2',
      `../exports/${exportFilename}`
    ], path.join(__dirname, 'clips'));

    // Clean up temporary ASS file
    fs.unlink(assPath, (err) => {
      if (err) console.error('Error deleting temp ASS file:', err);
    });

    // Save to database history
    const exportItem = {
      id: `exp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      clipFilename,
      exportFilename,
      exportUrl: `/exports/${exportFilename}`,
      style,
      font,
      crop: activeCropMode !== 'original',
      cropMode: activeCropMode,
      title: title || 'Untitled Clip',
      description: description || '',
      hashtags: hashtags || [],
      captions
    };
    saveExportToHistory(exportItem);

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

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { exports: [] };
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json, returning empty structure:', err);
    return { exports: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

function saveExportToHistory(exportItem) {
  try {
    const db = readDb();
    db.exports.unshift(exportItem);
    writeDb(db);
  } catch (err) {
    console.error('Error saving export item:', err);
  }
}

// ----------------------------------------------------
// 6.5. Download Endpoint
// ----------------------------------------------------
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Security check: ensure path traversal is prevented
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, 'exports', safeFilename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, safeFilename);
  } else {
    res.status(404).json({ error: 'Video file not found.' });
  }
});

// ----------------------------------------------------
// 7. History Endpoints
// ----------------------------------------------------
app.get('/api/history', (req, res) => {
  try {
    const db = readDb();
    res.json({ success: true, exports: db.exports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const index = db.exports.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'History item not found.' });
    }

    const item = db.exports[index];
    
    // Delete video file
    const filePath = path.join(__dirname, 'exports', item.exportFilename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete video file ${filePath}:`, err);
      });
    }

    db.exports.splice(index, 1);
    writeDb(db);

    res.json({ success: true, message: 'History item deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const https = require('https');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects (important for GitHub raw files)
      if (response.statusCode === 301 || response.statusCode === 302) {
        resolve(downloadFile(response.headers.location, dest));
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function ensureFonts() {
  const fontsDir = path.join(__dirname, 'fonts');
  const fontUrls = {
    'TheBoldFont.ttf': 'https://raw.githubusercontent.com/LonamiWebs/8-Bally-Pool/master/src/Resources/Original/font/theboldfont.ttf',
    'Montserrat-Black.ttf': 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Black.ttf',
    'Bangers-Regular.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/bangers/Bangers-Regular.ttf',
    'FredokaOne-Regular.ttf': 'https://raw.githubusercontent.com/pimoroni/fonts-python/master/font-fredoka-one/font_fredoka_one/files/FredokaOne-Regular.ttf'
  };

  for (const [filename, url] of Object.entries(fontUrls)) {
    const dest = path.join(fontsDir, filename);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading font ${filename} for viral subtitles...`);
      try {
        await downloadFile(url, dest);
        console.log(`Successfully downloaded ${filename}`);
      } catch (err) {
        console.error(`Failed to download font ${filename}:`, err);
      }
    }
  }
}

// Ensure fonts are downloaded, then start the server
ensureFonts().then(() => {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  Clipper Server is running on port ${PORT}`);
    console.log(`  Access the app at http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}).catch(err => {
  console.error('Failed to initialize fonts on startup:', err);
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  Clipper Server is running on port ${PORT}`);
    console.log(`  Access the app at http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
});
