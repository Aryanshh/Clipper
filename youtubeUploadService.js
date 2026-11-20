const fs = require('fs');
const path = require('path');

class YoutubeUploadService {
  constructor(dbPath) {
    this.dbPath = dbPath;
  }

  getDb() {
    if (!fs.existsSync(this.dbPath)) return { exports: [] };
    try {
      return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    } catch (e) {
      return { exports: [] };
    }
  }

  saveDb(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save db.json:', e);
    }
  }

  getAuthConfig() {
    const db = this.getDb();
    const yt = db.youtubeAuth || {};
    return {
      clientId: process.env.YOUTUBE_CLIENT_ID || yt.clientId || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || yt.clientSecret || '',
      refreshToken: yt.refreshToken || '',
      accessToken: yt.accessToken || '',
      tokenExpiry: yt.tokenExpiry || 0,
      channelTitle: yt.channelTitle || '',
      channelAvatar: yt.channelAvatar || '',
      privacyStatus: yt.privacyStatus || 'public'
    };
  }

  // Save or update OAuth credentials & settings
  saveCredentials(clientId, clientSecret, privacyStatus = 'public') {
    const db = this.getDb();
    db.youtubeAuth = {
      ...(db.youtubeAuth || {}),
      clientId: (clientId || '').trim(),
      clientSecret: (clientSecret || '').trim(),
      privacyStatus: privacyStatus || 'public'
    };
    this.saveDb(db);
  }

  // Disconnect channel
  disconnect() {
    const db = this.getDb();
    if (db.youtubeAuth) {
      db.youtubeAuth.accessToken = '';
      db.youtubeAuth.refreshToken = '';
      db.youtubeAuth.channelTitle = '';
      db.youtubeAuth.channelAvatar = '';
      db.youtubeAuth.tokenExpiry = 0;
      this.saveDb(db);
    }
  }

  // Generate Google OAuth authorization URL
  getAuthUrl(redirectUri) {
    const config = this.getAuthConfig();
    if (!config.clientId) {
      throw new Error('YouTube Client ID is not configured. Please add it in Settings.');
    }
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async handleCallback(code, redirectUri) {
    const config = this.getAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Client ID and Client Secret must be set before connecting your channel.');
    }

    const tokenParams = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      throw new Error(err.error_description || err.error || 'Failed to exchange authorization code for tokens');
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token || config.refreshToken;
    const tokenExpiry = Date.now() + ((tokens.expires_in || 3600) * 1000);

    // Fetch channel details
    let channelTitle = 'My YouTube Channel';
    let channelAvatar = '';
    try {
      const chanRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (chanRes.ok) {
        const chanData = await chanRes.json();
        if (chanData.items && chanData.items.length > 0) {
          const item = chanData.items[0];
          channelTitle = item.snippet.title;
          channelAvatar = item.snippet.thumbnails?.default?.url || '';
        }
      }
    } catch (e) {
      console.warn('Could not fetch YouTube channel details:', e.message);
    }

    const db = this.getDb();
    db.youtubeAuth = {
      ...(db.youtubeAuth || {}),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      accessToken,
      refreshToken,
      tokenExpiry,
      channelTitle,
      channelAvatar,
      privacyStatus: config.privacyStatus || 'public'
    };
    this.saveDb(db);

    return { channelTitle, channelAvatar };
  }

  // Get valid access token, auto-refreshing if expired
  async getValidAccessToken() {
    const config = this.getAuthConfig();
    if (!config.refreshToken) {
      throw new Error('YouTube channel is not connected. Please connect your channel in Settings.');
    }

    // If access token is still valid (with 60s buffer), return it
    if (config.accessToken && config.tokenExpiry && (config.tokenExpiry - Date.now() > 60000)) {
      return config.accessToken;
    }

    console.log('[YouTube Auth] Refreshing expired access token...');
    const refreshParams = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token'
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: refreshParams.toString()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Failed to refresh YouTube access token: ' + (err.error_description || err.error));
    }

    const tokens = await res.json();
    const newAccessToken = tokens.access_token;
    const newExpiry = Date.now() + ((tokens.expires_in || 3600) * 1000);

    const db = this.getDb();
    db.youtubeAuth = {
      ...(db.youtubeAuth || {}),
      accessToken: newAccessToken,
      tokenExpiry: newExpiry
    };
    this.saveDb(db);

    return newAccessToken;
  }

  // Upload video as YouTube Short via Resumable Upload API
  async uploadVideo({ filePath, title, description, hashtags, privacyStatus }) {
    if (!fs.existsSync(filePath)) {
      throw new Error('Video file does not exist: ' + filePath);
    }

    const accessToken = await this.getValidAccessToken();
    const config = this.getAuthConfig();
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Formatting for YouTube Shorts
    let cleanTitle = (title || 'Viral Gaming Clip').trim();
    if (!cleanTitle.toLowerCase().includes('#shorts')) {
      cleanTitle = cleanTitle.slice(0, 90) + ' #Shorts';
    }

    const tagList = Array.isArray(hashtags) 
      ? hashtags.map(t => t.replace('#', '')) 
      : (hashtags ? hashtags.split(/[\s,]+/).map(t => t.replace('#', '')).filter(Boolean) : ['Shorts', 'Gaming']);

    const fullDescription = `${description || ''}\n\n${(Array.isArray(hashtags) ? hashtags : [hashtags]).filter(Boolean).join(' ')}\n\nAuto-created with Clipper`;

    const metadata = {
      snippet: {
        title: cleanTitle.slice(0, 100),
        description: fullDescription.slice(0, 5000),
        tags: tagList.slice(0, 20),
        categoryId: '20' // Gaming category ID
      },
      status: {
        privacyStatus: privacyStatus || config.privacyStatus || 'public',
        selfDeclaredMadeForKids: false
      }
    };

    console.log(`[YouTube Upload] Initializing upload for "${cleanTitle}" (${fileSize} bytes)...`);

    // Step 1: Initialize Resumable Upload
    const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': fileSize.toString()
      },
      body: JSON.stringify(metadata)
    });

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      throw new Error('YouTube upload initialization failed: ' + (err.error?.message || initRes.statusText));
    }

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      throw new Error('YouTube did not return an upload location header.');
    }

    console.log(`[YouTube Upload] Streaming video file to YouTube endpoint...`);

    // Step 2: Upload file stream
    const fileStream = fs.createReadStream(filePath);
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString()
      },
      body: fileStream,
      duplex: 'half'
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error('YouTube binary upload failed: ' + (err.error?.message || uploadRes.statusText));
    }

    const result = await uploadRes.json();
    const videoId = result.id;
    const shortUrl = `https://youtube.com/shorts/${videoId}`;

    console.log(`[YouTube Upload] Published successfully! URL: ${shortUrl}`);

    return {
      success: true,
      videoId,
      youtubeUrl: shortUrl,
      title: result.snippet?.title || cleanTitle,
      privacyStatus: result.status?.privacyStatus || metadata.status.privacyStatus
    };
  }
}

module.exports = YoutubeUploadService;
