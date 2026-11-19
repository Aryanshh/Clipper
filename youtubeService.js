const { spawn } = require('child_process');
const https = require('https');

class YoutubeService {
  constructor() {
    this.defaultPresets = [
      { id: 'gta6_live', label: '🎮 GTA 6 Live Streams', query: 'GTA 6 live stream gaming', isLive: true },
      { id: 'gta6_gameplay', label: '🏎️ GTA 6 Gameplay', query: 'GTA 6 gameplay leaks reaction', isLive: false },
      { id: 'gta_rp_live', label: '🔥 GTA V RP Live', query: 'GTA 5 RP live stream gaming', isLive: true },
      { id: 'trending_gaming', label: '⚡ Trending Gaming Live', query: 'gaming live stream', isLive: true }
    ];
  }

  // Get available presets
  getPresets() {
    return this.defaultPresets;
  }

  /**
   * Search YouTube using either YouTube Data API v3 (if key provided/configured)
   * or yt-dlp (quota-free zero-cost fallback).
   */
  async search({ query = 'GTA 6 live stream gaming', isLive = true, maxResults = 8, apiKey = null }) {
    const key = apiKey || process.env.YOUTUBE_API_KEY;

    // 1. Try YouTube Data API v3 if API key exists
    if (key && key.trim() !== '') {
      try {
        console.log(`[YoutubeService] Attempting search via YouTube Data API v3 for query: "${query}"`);
        const apiResults = await this.searchViaApi(query, isLive, maxResults, key.trim());
        if (apiResults && apiResults.length > 0) {
          return {
            success: true,
            source: 'youtube_data_api_v3',
            query,
            isLive,
            count: apiResults.length,
            videos: apiResults
          };
        }
        console.log('[YoutubeService] YouTube Data API v3 returned 0 results, falling back to yt-dlp...');
      } catch (err) {
        console.warn(`[YoutubeService] YouTube Data API v3 failed (${err.message}). Falling back to yt-dlp...`);
      }
    }

    // 2. Fallback to yt-dlp search
    console.log(`[YoutubeService] Executing yt-dlp search for query: "${query}"`);
    try {
      const ytdlpResults = await this.searchViaYtDlp(query, isLive, maxResults);
      return {
        success: true,
        source: 'yt_dlp',
        query,
        isLive,
        count: ytdlpResults.length,
        videos: ytdlpResults
      };
    } catch (err) {
      console.error('[YoutubeService] Both YouTube API and yt-dlp search failed:', err);
      throw new Error(`Failed to search YouTube: ${err.message}`);
    }
  }

  /**
   * YouTube Data API v3 Search implementation
   */
  searchViaApi(query, isLive, maxResults, apiKey) {
    return new Promise((resolve, reject) => {
      let endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${Math.min(maxResults, 25)}&q=${encodeURIComponent(query)}&key=${apiKey}&videoCategoryId=20`;
      if (isLive) {
        endpoint += '&eventType=live';
      }

      https.get(endpoint, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            try {
              const errObj = JSON.parse(data);
              return reject(new Error(errObj.error?.message || `HTTP ${res.statusCode}`));
            } catch (e) {
              return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 150)}`));
            }
          }

          try {
            const parsed = JSON.parse(data);
            const items = parsed.items || [];
            const results = items.map(item => {
              const snippet = item.snippet || {};
              const id = item.id?.videoId;
              const thumbnails = snippet.thumbnails || {};
              const thumbUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
              const liveBroadcast = snippet.liveBroadcastContent; // 'live', 'upcoming', 'none'
              const isVideoLive = liveBroadcast === 'live';

              return {
                id,
                title: snippet.title || 'Untitled Stream',
                channel: snippet.channelTitle || 'Gaming Channel',
                description: snippet.description || '',
                thumbnail: thumbUrl,
                liveStatus: liveBroadcast || 'none',
                isLive: isVideoLive,
                publishedAt: snippet.publishedAt,
                url: `https://www.youtube.com/watch?v=${id}`
              };
            });

            resolve(results);
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * yt-dlp Search implementation (zero-cost, no API key required)
   */
  searchViaYtDlp(query, isLive, maxResults) {
    return new Promise((resolve, reject) => {
      // If user specifically asked for live, append "live" or "live stream" if not in query
      let searchQuery = query;
      if (isLive && !/live/i.test(searchQuery)) {
        searchQuery = `${searchQuery} live stream`;
      }

      const limit = Math.min(Math.max(maxResults || 8, 4), 20);
      const args = [
        `ytsearch${limit}:${searchQuery}`,
        '--dump-json',
        '--flat-playlist',
        '--no-check-certificate'
      ];

      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', data => {
        stdout += data.toString();
      });

      proc.stderr.on('data', data => {
        stderr += data.toString();
      });

      proc.on('close', code => {
        if (code !== 0 && !stdout.trim()) {
          return reject(new Error(`yt-dlp exited with code ${code}. Error: ${stderr.slice(-200)}`));
        }

        const lines = stdout.split('\n');
        const results = [];

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line.trim());
            const id = obj.id;
            if (!id) continue;

            const isItemLive = obj.is_live === true || obj.live_status === 'is_live';
            const wasLive = obj.was_live === true || obj.live_status === 'was_live';
            
            // Choose thumbnail
            let thumbUrl = obj.thumbnail;
            if (!thumbUrl && Array.isArray(obj.thumbnails) && obj.thumbnails.length > 0) {
              thumbUrl = obj.thumbnails[obj.thumbnails.length - 1].url;
            }
            if (!thumbUrl) {
              thumbUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }

            results.push({
              id,
              title: obj.title || 'Gaming Video',
              channel: obj.channel || obj.uploader || 'Creator',
              description: obj.description || '',
              thumbnail: thumbUrl,
              liveStatus: obj.live_status || (isItemLive ? 'is_live' : (wasLive ? 'was_live' : 'none')),
              isLive: isItemLive,
              wasLive,
              duration: obj.duration_string || (obj.duration ? `${Math.floor(obj.duration / 60)}:${String(obj.duration % 60).padStart(2, '0')}` : (isItemLive ? 'LIVE' : '')),
              viewCount: obj.view_count || null,
              url: `https://www.youtube.com/watch?v=${id}`
            });
          } catch (e) {
            // ignore non-json line
          }
        }

        // Sort: active live streams first
        results.sort((a, b) => {
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          return 0;
        });

        resolve(results.slice(0, limit));
      });

      proc.on('error', reject);
    });
  }
}

module.exports = new YoutubeService();
