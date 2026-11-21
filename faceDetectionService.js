const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FaceDetectionService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Detect streamer facecam in a video using Python + OpenCV AI tracker
   * @param {string} videoPath - Absolute or relative path to video file
   * @returns {Promise<object>}
   */
  async detect(videoPath) {
    const resolvedPath = path.resolve(videoPath);
    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        detected: false,
        error: `File not found: ${resolvedPath}`,
        camCrop: 'crop=iw*0.34:ih*0.42:iw*0.66:ih*0.58',
        facecamPosition: 'bottom_right'
      };
    }

    // Check memory cache
    const cacheKey = `${resolvedPath}_${fs.statSync(resolvedPath).size}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, 'detect_facecam.py');
      const proc = spawn('python', [scriptPath, resolvedPath], {
        cwd: __dirname,
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', d => stdout += d.toString());
      proc.stderr.on('data', d => stderr += d.toString());

      const timer = setTimeout(() => {
        try { proc.kill(); } catch (e) {}
        console.warn('[FaceDetection] Process timed out after 30s, falling back to default.');
        const fallback = {
          success: true,
          detected: false,
          fallback: true,
          facecamPosition: 'bottom_right',
          camCrop: 'crop=iw*0.34:ih*0.42:iw*0.66:ih*0.58'
        };
        resolve(fallback);
      }, 30000);

      proc.on('close', (code) => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed && parsed.success) {
            this.cache.set(cacheKey, parsed);
            return resolve(parsed);
          }
        } catch (e) {
          // JSON parse failed
        }

        console.warn(`[FaceDetection] Notice: ${stderr.slice(-200) || `Exit code ${code}`}`);
        const fallback = {
          success: true,
          detected: false,
          fallback: true,
          facecamPosition: 'bottom_right',
          camCrop: 'crop=iw*0.34:ih*0.42:iw*0.66:ih*0.58'
        };
        resolve(fallback);
      });
    });
  }
}

module.exports = new FaceDetectionService();
