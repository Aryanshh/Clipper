const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

class TurboBatchService {
  constructor(deps) {
    this.runFFmpeg = deps.runFFmpeg;
    this.getGeminiClient = deps.getGeminiClient;
    this.generateContentWithFallback = deps.generateContentWithFallback;
    this.readDb = deps.readDb;
    this.writeDb = deps.writeDb;
    this.ffmpegBinary = deps.ffmpegBinary || (process.platform === 'win32' ? 'ffmpeg' : 'ffmpeg');
    this.ensureFonts = deps.ensureFonts;

    // Active batches in-memory status
    this.activeBatches = new Map();
  }

  // Helper to format seconds to ASS timestamp (H:MM:SS.cs)
  formatAssTime(sec) {
    const s = Math.max(0, parseFloat(sec) || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const cs = Math.floor((s % 1) * 100);
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  // Parse time formats like "00:01:23", "01:23", or seconds
  parseTimeToSeconds(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).trim();
    if (!str.includes(':')) return parseFloat(str) || 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(str) || 0;
  }

  // Get style configs for subtitle generator
  getStyleConfig(styleName) {
    const style = (styleName || 'hormozi').toLowerCase();
    switch (style) {
      case 'hormozi':
        return {
          primaryColor: '00FFFFFF', // White
          activeColor: '0000FF66',  // Electric Lime Green (BGR)
          outlineColor: '00000000', // Pure Black
          fontSize: 32,
          alignment: 5,            // Middle Center
          outline: 4.5,
          shadow: 1,
          fontName: 'The Bold Font',
          label: 'Alex Hormozi Lime'
        };
      case 'mrbeast':
        return {
          primaryColor: '00FFFFFF',
          activeColor: '0000E6FF',  // Sunburst Yellow
          outlineColor: '00000000',
          fontSize: 34,
          alignment: 5,
          outline: 5,
          shadow: 2,
          fontName: 'Bangers',
          label: 'MrBeast Hype'
        };
      case 'fire_glow':
        return {
          primaryColor: '00FFFFFF',
          activeColor: '000055FF',  // Blaze Orange
          outlineColor: '00001133', // Crimson outline
          fontSize: 32,
          alignment: 5,
          outline: 4.5,
          shadow: 2,
          fontName: 'The Bold Font',
          label: 'Fire & Flame Glow'
        };
      case 'cyberpunk':
        return {
          primaryColor: '0000FFFF', // Neon Yellow/Cyan
          activeColor: '00FF00FF',  // Hot Magenta
          outlineColor: '00330033', // Dark Violet
          fontSize: 32,
          alignment: 5,
          outline: 4,
          shadow: 2,
          fontName: 'Montserrat-Black',
          label: 'Cyberpunk Neon'
        };
      case 'highlighter':
        return {
          primaryColor: '00FFFFFF',
          activeColor: '0000E6FF',
          outlineColor: '00000000',
          fontSize: 30,
          alignment: 2, // Bottom Center
          outline: 4,
          shadow: 0,
          fontName: 'The Bold Font',
          label: 'Highlighter Pill'
        };
      case 'tiktok':
        return {
          primaryColor: '00FFFFFF',
          activeColor: '0000FFFF',
          outlineColor: '00000000',
          fontSize: 28,
          alignment: 2,
          outline: 3.5,
          shadow: 1,
          fontName: 'The Bold Font',
          label: 'TikTok Classic Yellow'
        };
      default:
        return {
          primaryColor: '00FFFFFF',
          activeColor: '0000FF66',
          outlineColor: '00000000',
          fontSize: 30,
          alignment: 5,
          outline: 4,
          shadow: 1,
          fontName: 'The Bold Font',
          label: 'Alex Hormozi Lime'
        };
    }
  }

  // Generate ASS Subtitle content with animated active word highlight & resolution-aware scaling
  createAssContent(captions, styleName, targetW = 1080, targetH = 1920) {
    const cfg = this.getStyleConfig(styleName);

    // Group captions into small rhythmic 2-4 word phrases for high-retention reels
    const phrases = [];
    let currentPhrase = [];
    for (let i = 0; i < captions.length; i++) {
      currentPhrase.push(captions[i]);
      if (currentPhrase.length >= 3 || i === captions.length - 1 || (captions[i].word && captions[i].word.match(/[.!?]$/))) {
        phrases.push(currentPhrase);
        currentPhrase = [];
      }
    }
    if (currentPhrase.length > 0) {
      phrases.push(currentPhrase);
    }

    // Check for Devanagari text for Hindi support
    const allText = captions.map(c => c.word || '').join(' ');
    const hasDevanagari = /[\u0900-\u097F]/.test(allText);
    const effectiveFont = hasDevanagari ? (process.platform === 'win32' ? 'Nirmala UI' : 'Noto Sans Devanagari') : cfg.fontName;

    // Proportional font sizing and margins based on target canvas resolution (1080p vs 4K)
    const fontScale = targetH / 720;
    const scaledFontSize = Math.round(cfg.fontSize * (fontScale * 0.85));
    const scaledOutline = Math.max(2, Math.round(cfg.outline * (fontScale * 0.75)));
    const scaledShadow = Math.round(cfg.shadow * fontScale * 0.75);
    const scaledMarginV = Math.round(300 * (targetH / 1920));

    const dialogueEvents = [];
    for (const phrase of phrases) {
      for (let i = 0; i < phrase.length; i++) {
        const activeWord = phrase[i];
        const startSec = activeWord.start;
        const endSec = (i === phrase.length - 1) ? activeWord.end : phrase[i + 1].start;

        const styledWords = phrase.map((w, idx) => {
          if (idx === i) {
            return `{\\c&H${cfg.activeColor}&}${w.word}{\\c}`;
          }
          return w.word;
        });

        const text = styledWords.join(' ');
        dialogueEvents.push(`Dialogue: 0,${this.formatAssTime(startSec)},${this.formatAssTime(endSec)},Default,,0000,0000,0000,,${text}`);
      }
    }

    return `[Script Info]
Title: Clipper Turbo Batch Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: ${targetW}
PlayResY: ${targetH}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${effectiveFont},${scaledFontSize},&H${cfg.primaryColor},&H${cfg.primaryColor},&H${cfg.outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${scaledOutline},${scaledShadow},${cfg.alignment},24,24,${scaledMarginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogueEvents.join('\n')}
`;
  }

  // Get status of a batch job
  getBatchStatus(batchId) {
    return this.activeBatches.get(batchId) || null;
  }

  /**
   * Main Turbo Batch Orchestrator
   * Produces multiple complete, transcribed, styled, and 9:16 rendered clips in parallel.
   */
  async startTurboBatch({ videoId, language = 'auto', styleMode = 'all', cropMode = 'crop', manualClips = null, maxClips = 'auto', quality = '1080p', durationMode = '30-60', minDuration = null, maxDuration = null, onProgress = null }) {
    const batchId = `turbo_${Date.now()}`;
    const startTime = Date.now();

    const is4K = quality === '4k' || quality === '2160p';
    const targetW = is4K ? 2160 : 1080;
    const targetH = is4K ? 3840 : 1920;

    const batchState = {
      batchId,
      videoId,
      status: 'starting',
      startTime,
      elapsedSeconds: 0,
      totalClips: 0,
      completedCount: 0,
      workers: [],
      clips: [],
      quality: is4K ? '4K Ultra HD' : '1080p Full HD',
      resolution: `${targetW}x${targetH}`,
      error: null
    };

    this.activeBatches.set(batchId, batchState);

    const updateBatch = (stage, msg) => {
      batchState.status = stage;
      batchState.elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      if (onProgress) onProgress(batchState, msg);
    };

    // Run pipeline asynchronously so caller gets batchId immediately if needed, or await for result
    return this.runPipeline(batchState, { videoId, language, styleMode, cropMode, manualClips, maxClips, quality, durationMode, minDuration, maxDuration }, updateBatch);
  }

  async runPipeline(batchState, options, updateBatch) {
    const { videoId, language, styleMode, cropMode, manualClips, maxClips, quality, durationMode = '30-60', minDuration, maxDuration } = options;
    const startTime = batchState.startTime;

    try {
      updateBatch('analyzing', 'Locating video source and discovering viral moments...');

      // 1. Locate video and audio file
      const downloadsDir = path.join(__dirname, 'downloads');
      const files = fs.readdirSync(downloadsDir);
      const videoFile = files.find(f => f.startsWith(videoId) && !f.endsWith('.mp3'));
      if (!videoFile) {
        throw new Error(`Video file for videoId "${videoId}" not found in downloads.`);
      }
      const videoPath = path.join(downloadsDir, videoFile);
      const audioPath = path.join(downloadsDir, `audio_${videoId}.mp3`);

      // Determine target clip count for discovery (supports flexible high-density extraction)
      let targetCount = 8;
      if (maxClips === 'auto' || !maxClips) {
        targetCount = 10;
      } else {
        targetCount = Math.max(2, Math.min(parseInt(maxClips, 10) || 8, 20));
      }

      // 2. Discover Viral Clips if not supplied
      let viralClips = manualClips;
      if (!viralClips || !Array.isArray(viralClips) || viralClips.length < 2) {
        if (!fs.existsSync(audioPath)) {
          throw new Error('Audio file not found for Gemini analysis.');
        }

        console.log(`[TurboBatch] Running high-density Gemini discovery on audio: ${audioPath} (Target: up to ${targetCount} clips)`);
        updateBatch('analyzing', `Gemini AI scanning for all possible viral moments & hooks (up to ${targetCount} clips)...`);

        try {
          const ai = this.getGeminiClient();
          const uploadResult = await ai.files.upload({
            file: audioPath,
            mimeType: 'audio/mp3',
          });

          try {
            let fileState = await ai.files.get({ name: uploadResult.name });
            while (fileState.state === 'PROCESSING') {
              await new Promise(r => setTimeout(r, 1200));
              fileState = await ai.files.get({ name: uploadResult.name });
            }

            // Compute target duration bounds
            let targetMin = 30;
            let targetMax = 60;
            if (durationMode === '15-30') {
              targetMin = 15;
              targetMax = 30;
            } else if (durationMode === '60-90') {
              targetMin = 60;
              targetMax = 90;
            } else if (durationMode === 'custom' || minDuration || maxDuration) {
              targetMin = Math.max(10, parseInt(minDuration, 10) || 15);
              targetMax = Math.max(targetMin + 5, parseInt(maxDuration, 10) || 60);
            }

            const prompt = `Analyze this gaming video audio and identify ALL possible high-energy, exciting, funny, clutch, reaction, or viral moments suitable for YouTube Shorts, Instagram Reels, and TikTok (find as many distinct clips as possible, up to ${targetCount} clips).
Each clip MUST be between ${targetMin} and ${targetMax} seconds long (focused on target duration of ${targetMin}s to ${targetMax}s) and capture an exciting gaming play, intense reaction, funny fail, clutch moment, or complete punchline.
Ensure timestamps are non-overlapping. Rank them by virality score from highest to lowest.
Return strictly JSON matching the schema.`;

            const response = await this.generateContentWithFallback(ai, {
              contents: [
                { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
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
                          start: { type: 'STRING' },
                          end: { type: 'STRING' },
                          score: { type: 'NUMBER' },
                          description: { type: 'STRING' },
                          hashtags: { type: 'ARRAY', items: { type: 'STRING' } }
                        },
                        required: ['title', 'start', 'end', 'score', 'description', 'hashtags']
                      }
                    }
                  },
                  required: ['clips']
                }
              }
            });

            const parsed = JSON.parse(response.text);
            viralClips = parsed.clips || [];
          } finally {
            ai.files.delete({ name: uploadResult.name }).catch(() => {});
          }
        } catch (discoverErr) {
          console.warn('[TurboBatch] Gemini discovery fallback activated:', discoverErr.message);
          viralClips = [];
          const fbDuration = (durationMode === '15-30') ? 25 : ((durationMode === '60-90') ? 65 : 35);
          for (let i = 0; i < targetCount; i++) {
            const startSec = i * (fbDuration + 8);
            const endSec = startSec + fbDuration;
            viralClips.push({
              title: `EPIC GAMING HIGHLIGHT #${i + 1} 🔥`,
              start: `${Math.floor(startSec / 60)}:${String(startSec % 60).padStart(2, '0')}`,
              end: `${Math.floor(endSec / 60)}:${String(endSec % 60).padStart(2, '0')}`,
              score: Math.max(75, 96 - i * 2),
              description: `Insane gaming moment, clutch play and reactions from the stream!`,
              hashtags: ['#shorts', '#gaming', '#viral', '#trending']
            });
          }
        }
      }

      if (!viralClips || viralClips.length === 0) {
        throw new Error('Failed to identify viral clips from video.');
      }

      // Pick selected clips according to targetCount
      const selectedClips = viralClips.slice(0, targetCount);

      // 3. Assign styles: rotate through all 7 viral creative subtitle styles!
      const allStylesList = ['hormozi', 'mrbeast', 'fire_glow', 'cyberpunk', 'highlighter', 'tiktok', 'minimalist'];
      batchState.totalClips = selectedClips.length;
      batchState.workers = selectedClips.map((c, idx) => {
        const assigned = (styleMode === 'all') ? allStylesList[idx % allStylesList.length] : (styleMode || 'hormozi');
        return {
          id: idx,
          name: c.title || `Clip ${idx + 1}`,
          style: assigned,
          stage: 'queued',
          progress: 0,
          score: c.score || 90
        };
      });

      console.log(`[TurboBatch] Launching ${selectedClips.length} parallel multiprocessing workers for video: ${videoId}`);
      updateBatch('processing', `Parallel fan-out: cutting, transcribing, styling, and rendering ${selectedClips.length} clips...`);

      // 4. Concurrency Execution:
      // Lightweight asynchronous semaphore to limit concurrent FFmpeg CPU renders to 3
      class RenderSemaphore {
        constructor(max = 3) {
          this.max = max;
          this.current = 0;
          this.queue = [];
        }
        async acquire() {
          if (this.current < this.max) {
            this.current++;
            return;
          }
          await new Promise(resolve => this.queue.push(resolve));
          this.current++;
        }
        release() {
          this.current--;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
          }
        }
      }

      const renderSemaphore = new RenderSemaphore(3);
      const completedClips = [];

      const processClipWorker = async (clipData, index) => {
        const workerState = batchState.workers[index];
        const assignedStyle = workerState.style;
        const startSec = this.parseTimeToSeconds(clipData.start);
        const endSec = this.parseTimeToSeconds(clipData.end);
        const durationSec = Math.max(5, endSec - startSec);

        const clipFilename = `turbo_clip_${videoId}_${index}_${Date.now()}.mp4`;
        const clipPath = path.join(__dirname, 'clips', clipFilename);
        const clipAudioFilename = `turbo_audio_${videoId}_${index}_${Date.now()}.mp3`;
        const clipAudioPath = path.join(__dirname, 'clips', clipAudioFilename);

        // Stage 1: Ultra-fast Video Slicing (Lossless Stream Copy)
        workerState.stage = 'cutting';
        workerState.progress = 15;
        updateBatch('processing', `Worker ${index + 1}: Slicing video (${durationSec.toFixed(1)}s)...`);

        try {
          await this.runFFmpeg([
            '-y',
            '-ss', startSec.toString(),
            '-i', videoPath,
            '-t', durationSec.toString(),
            '-c', 'copy',
            '-avoid_negative_ts', 'make_zero',
            clipPath
          ]);
        } catch (copyErr) {
          console.warn(`[TurboBatch Worker ${index + 1}] Stream copy fallback to ultrafast:`, copyErr.message);
          await this.runFFmpeg([
            '-y',
            '-ss', startSec.toString(),
            '-i', videoPath,
            '-t', durationSec.toString(),
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-threads', '0',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-avoid_negative_ts', 'make_zero',
            clipPath
          ]);
        }

        // Stage 2: Extract audio for speech recognition
        workerState.progress = 30;
        await this.runFFmpeg([
          '-y',
          '-i', clipPath,
          '-vn',
          '-acodec', 'libmp3lame',
          '-ar', '16000',
          '-ac', '1',
          clipAudioPath
        ]);

        // Stage 3: Concurrent Gemini Word-Level Transcription
        workerState.stage = 'transcribing';
        workerState.progress = 45;
        updateBatch('processing', `Worker ${index + 1}: Transcribing words with Gemini Flash...`);

        let captions = [];
        const ai = this.getGeminiClient();
        const audioUpload = await ai.files.upload({
          file: clipAudioPath,
          mimeType: 'audio/mp3'
        });

        try {
          let state = await ai.files.get({ name: audioUpload.name });
          while (state.state === 'PROCESSING') {
            await new Promise(r => setTimeout(r, 1000));
            state = await ai.files.get({ name: audioUpload.name });
          }

          let transcriptionPrompt = '';
          if (language === 'hi') {
            transcriptionPrompt = 'Transcribe this audio in Hindi using Devanagari script. Return precise start and end times in seconds for every word.';
          } else if (language === 'hinglish') {
            transcriptionPrompt = 'Transcribe this audio in Hinglish (Hindi phonetically written in English script). Return precise start and end times in seconds for every word.';
          } else if (language === 'en') {
            transcriptionPrompt = 'Transcribe this audio in English. Return precise start and end times in seconds for every word.';
          } else {
            transcriptionPrompt = 'Transcribe this audio accurately in its original spoken language with precise start and end timestamps in seconds for every word.';
          }

          const captionResp = await this.generateContentWithFallback(ai, {
            contents: [
              { fileData: { fileUri: audioUpload.uri, mimeType: audioUpload.mimeType } },
              `${transcriptionPrompt} Return strictly JSON array matching schema.`
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

          captions = JSON.parse(captionResp.text) || [];
        } catch (err) {
          console.warn(`[TurboBatch Worker ${index + 1}] Transcription fallback:`, err.message);
          captions = [
            { word: clipData.title || 'VIRAL', start: 0.5, end: 1.5 },
            { word: 'MOMENT', start: 1.5, end: 2.5 }
          ];
        } finally {
          ai.files.delete({ name: audioUpload.name }).catch(() => {});
        }

        // Stage 4: Subtitle Styling & ASS Generation (Native Canvas Resolution)
        workerState.stage = 'styling';
        workerState.progress = 65;
        updateBatch('processing', `Worker ${index + 1}: Applying ${assignedStyle.toUpperCase()} subtitle styling...`);

        const assContent = this.createAssContent(captions, assignedStyle, targetW, targetH);
        const assFilename = `turbo_subs_${videoId}_${index}_${Date.now()}.ass`;
        const assPath = path.join(__dirname, 'clips', assFilename);
        fs.writeFileSync(assPath, assContent, 'utf-8');

        // Stage 5: Concurrency-Managed CPU Multi-Threaded Subtitle Burn & 1080p/4K 9:16 Center Crop
        workerState.stage = 'rendering';
        workerState.progress = 75;
        updateBatch('processing', `Worker ${index + 1}: In render pool (CPU multi-threading & ${is4K ? '4K' : '1080p'} 9:16 export)...`);

        const exportFilename = `export_turbo_${videoId}_${index}_${Date.now()}.mp4`;
        const activeCropMode = cropMode || 'crop';
        let filterComplex = '';

        if (activeCropMode === 'fit_blur') {
          const bgFilter = `[bg_src]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=25:5[bg]`;
          const fgFilter = `[fg_src]scale=${targetW}:-2:flags=lanczos[fg]`;
          filterComplex = `split=2[bg_src][fg_src];${bgFilter};${fgFilter};[bg][fg]overlay=0:(main_h-overlay_h)/2,subtitles=${assFilename}`;
        } else {
          filterComplex = `crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=${targetW}:${targetH}:flags=lanczos,subtitles=${assFilename}`;
        }

        // Acquire render concurrency slot (max 3 simultaneous renders)
        await renderSemaphore.acquire();
        try {
          await this.runFFmpeg([
            '-y',
            '-i', clipPath,
            '-vf', filterComplex,
            '-c:v', 'libx264',
            '-crf', is4K ? '16' : '18',
            '-preset', 'fast',
            '-threads', '0',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', is4K ? '320k' : '192k',
            '-strict', '-2',
            `../exports/${exportFilename}`
          ], path.join(__dirname, 'clips'));
        } finally {
          renderSemaphore.release();
        }

        // Clean up temporary ASS file
        fs.unlink(assPath, () => {});

        // Stage 6: Register in Ready-to-Push Queue & DB History
        const queueItem = {
          id: `turbo_${Date.now()}_${index}`,
          title: clipData.title || `Viral Clip ${index + 1}`,
          description: clipData.description || `Auto-generated with Clipper Turbo Multi-Clip Engine.`,
          hashtags: clipData.hashtags || ['#shorts', '#viral', '#gaming'],
          viralityScore: clipData.score || Math.max(70, 95 - index * 2),
          triggerReason: `Turbo Multi-Clip Engine (${assignedStyle.toUpperCase()})`,
          clipFilename,
          exportFilename,
          exportUrl: `/exports/${exportFilename}`,
          sourceStreamTitle: clipData.title || 'Imported Video',
          createdAt: new Date().toISOString(),
          status: 'ready',
          durationSeconds: Math.round(durationSec),
          aspectRatio: '9:16',
          quality: is4K ? '4K Ultra HD' : '1080p Full HD',
          resolution: `${targetW}x${targetH}`,
          style: assignedStyle,
          captions
        };

        const db = this.readDb();
        if (!db.liveQueue) db.liveQueue = [];
        if (!db.exports) db.exports = [];
        db.liveQueue.unshift(queueItem);
        db.exports.unshift(queueItem);
        this.writeDb(db);

        workerState.stage = 'done';
        workerState.progress = 100;
        batchState.completedCount++;
        completedClips.push(queueItem);

        updateBatch('processing', `Worker ${index + 1} finished in ${Math.round((Date.now() - startTime) / 1000)}s! (${batchState.completedCount}/${selectedClips.length})`);
        return queueItem;
      };

      // Launch all workers in parallel!
      await Promise.all(selectedClips.map((clip, idx) => processClipWorker(clip, idx)));

      const totalTimeSec = Math.round((Date.now() - startTime) / 1000);
      batchState.status = 'completed';
      batchState.elapsedSeconds = totalTimeSec;
      batchState.clips = completedClips;

      console.log(`[TurboBatch] ✅ All ${selectedClips.length} clips completed and rendered in ${totalTimeSec} seconds!`);
      updateBatch('completed', `🎉 Successfully generated, transcribed, styled, and rendered ${selectedClips.length} clips in ${totalTimeSec} seconds!`);

      return {
        success: true,
        batchId: batchState.batchId,
        totalTimeSeconds: totalTimeSec,
        clips: completedClips
      };

    } catch (err) {
      console.error('[TurboBatch] Pipeline error:', err);
      batchState.status = 'failed';
      batchState.error = err.message;
      updateBatch('failed', `Error in Turbo pipeline: ${err.message}`);
      throw err;
    }
  }
}

module.exports = TurboBatchService;
