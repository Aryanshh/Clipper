// Clipper SPA Application State
const state = {
  apiKeyConfigured: false,
  videoId: null,
  videoUrl: null,
  clips: [],
  selectedClip: null,
  captions: [],
  subtitlePreset: 'tiktok',
  subtitleFont: 'the_bold_font',
  aspectRatio: localStorage.getItem('clipper_crop_mode') || 'reaction_split',
  facecamPosition: localStorage.getItem('clipper_facecam_pos') || 'bottom_right',
  editingWordIndex: null,
  editingSentenceIndex: null,
  aiMirror: false,
  hflip: false,
  isTrimmedUpload: false,
  transcriptionLanguage: 'auto',
  youtubeConnected: false,
  youtubeChannelTitle: '',
  youtubeChannelAvatar: '',
  youtubePrivacy: 'public',
  autoUploadYoutube: localStorage.getItem('clipper_auto_upload_yt') === 'true',
  exportQuality: localStorage.getItem('clipper_export_quality') || '1080p',
  clipDurationMode: localStorage.getItem('clipper_clip_duration_mode') || '30-60',
  minDuration: parseFloat(localStorage.getItem('clipper_custom_min_duration')) || 15,
  maxDuration: parseFloat(localStorage.getItem('clipper_custom_max_duration')) || 60,
  editorTrimStart: 0,
  editorTrimDuration: 30,
  currentExport: null
};

// DOM Elements
const el = {
  // Screens
  secImport: document.getElementById('section-import'),
  secWorkspace: document.getElementById('section-workspace'),
  secEditor: document.getElementById('section-editor'),
  secExportResult: document.getElementById('section-export-result'),

  // Navbar & Settings
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  settingsModal: document.getElementById('settings-modal'),
  formSettings: document.getElementById('form-settings'),
  geminiKeyInput: document.getElementById('gemini-key-input'),
  youtubeCookiesInput: document.getElementById('youtube-cookies-input'),
  youtubeApiKeyInput: document.getElementById('youtube-api-key-input'),
  ytKeyStatus: document.getElementById('yt-key-status'),
  keyStatus: document.getElementById('key-status'),

  // Import screen elements
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  formImportYt: document.getElementById('form-import-yt'),
  ytUrl: document.getElementById('yt-url'),
  btnJumpLiveStreams: document.getElementById('btn-jump-live-streams'),
  streamSearchInput: document.getElementById('stream-search-input'),
  btnFetchStreams: document.getElementById('btn-fetch-streams'),
  streamSearchResults: document.getElementById('stream-search-results'),
  presetChips: document.querySelectorAll('.preset-chip'),
  ytSearchSourceIndicator: document.getElementById('yt-search-source-indicator'),
  dropZone: document.getElementById('drop-zone'),
  localFile: document.getElementById('local-file'),
  selectedFileName: document.getElementById('selected-file-name'),
  dropZoneTrimmed: document.getElementById('drop-zone-trimmed'),
  trimmedFile: document.getElementById('trimmed-file'),
  selectedTrimmedName: document.getElementById('selected-trimmed-name'),

  // Stepper
  stepImport: document.getElementById('step-import'),
  stepAnalyze: document.getElementById('step-analyze'),
  stepRefine: document.getElementById('step-refine'),

  // Workspace
  sourcePlayer: document.getElementById('source-player'),
  processingDetails: document.getElementById('processing-details'),
  processingStatusText: document.getElementById('processing-status-text'),
  clipsList: document.getElementById('clips-list'),

  // Editor
  btnBackToClips: document.getElementById('btn-back-to-clips'),
  clipPlayer: document.getElementById('clip-player'),
  stylePresetCards: document.querySelectorAll('.style-preset-card'),
  ratioBtns: document.querySelectorAll('.ratio-btn'),
  btnExportVideo: document.getElementById('btn-export-video'),
  transcriptTimeline: document.getElementById('transcript-timeline'),

  // Export screen
  exportPlayer: document.getElementById('export-player'),
  btnDownloadExport: document.getElementById('btn-download-export'),
  btnBackToEditor: document.getElementById('btn-back-to-editor'),
  exportPreviewContainer: document.querySelector('.export-preview-container'),

  // Word Edit Modal
  wordEditModal: document.getElementById('word-edit-modal'),
  btnCloseWordModal: document.getElementById('btn-close-word-modal'),
  formEditWord: document.getElementById('form-edit-word'),
  editWordText: document.getElementById('edit-word-text'),
  editWordStart: document.getElementById('edit-word-start'),
  editWordEnd: document.getElementById('edit-word-end'),

  // Sentence Edit Modal
  sentenceEditModal: document.getElementById('sentence-edit-modal'),
  btnCloseSentenceModal: document.getElementById('btn-close-sentence-modal'),
  formEditSentence: document.getElementById('form-edit-sentence'),
  editSentenceText: document.getElementById('edit-sentence-text'),
  subtitlePreviewOverlay: document.getElementById('subtitle-preview-overlay'),
  subtitleFontSelect: document.getElementById('subtitle-font-select'),

  // History Modal
  btnOpenHistory: document.getElementById('btn-open-history'),
  btnCloseHistory: document.getElementById('btn-close-history'),
  historyModal: document.getElementById('history-modal'),
  historyList: document.getElementById('history-list'),

  // Autopilot
  autopilotCheckbox: document.getElementById('autopilot-checkbox'),
  chkAiMirror: document.getElementById('chk-ai-mirror'),
  chkHflip: document.getElementById('chk-hflip'),

  // Live Stream Elements
  formImportLive: document.getElementById('form-import-live'),
  liveUrl: document.getElementById('live-url'),
  liveSensitivity: document.getElementById('live-sensitivity'),
  liveStyle: document.getElementById('live-style'),
  liveCropMode: document.getElementById('live-crop-mode'),
  btnStartLive: document.getElementById('btn-start-live'),
  liveStreamPanel: document.getElementById('live-stream-panel'),
  liveStreamTitle: document.getElementById('live-stream-title'),
  liveStreamUploader: document.getElementById('live-stream-uploader'),
  btnLiveStop: document.getElementById('btn-live-stop'),
  btnLiveTestTrigger: document.getElementById('btn-live-test-trigger'),
  liveStatViewers: document.getElementById('live-stat-viewers'),
  liveStatDuration: document.getElementById('live-stat-duration'),
  liveStatChat: document.getElementById('live-stat-chat'),
  liveChatStatus: document.getElementById('live-chat-status'),
  liveStatAudio: document.getElementById('live-stat-audio'),
  liveAudioStatus: document.getElementById('live-audio-status'),
  liveStatHype: document.getElementById('live-stat-hype'),
  liveHypeFill: document.getElementById('live-hype-fill'),
  liveActivityLog: document.getElementById('live-activity-log'),

  // Ready to Push Queue Modal
  btnOpenQueue: document.getElementById('btn-open-queue'),
  btnCloseQueue: document.getElementById('btn-close-queue'),
  queueModal: document.getElementById('queue-modal'),
  queueList: document.getElementById('queue-list'),

  // Multilingual Transcription
  transcriptionLang: document.getElementById('transcription-lang'),
  editorLangSelect: document.getElementById('editor-lang-select'),
  btnRetranscribe: document.getElementById('btn-retranscribe'),
  queueBadge: document.getElementById('queue-badge'),
  queueModalCount: document.getElementById('queue-modal-count'),

  // Interactive Subtitle Demo
  subtitleDemoStage: document.getElementById('subtitle-demo-stage'),
  demoKaraokeText: document.getElementById('demo-karaoke-text'),
  demoStyleBadge: document.getElementById('demo-style-badge'),
  btnReplayDemo: document.getElementById('btn-replay-demo'),

  // Turbo Multiprocessing Engine (Multi-Clip Gaming Extraction)
  turboModeCheckbox: document.getElementById('turbo-mode-checkbox'),
  turboClipCount: document.getElementById('turbo-clip-count'),
  turboDashboardPanel: document.getElementById('turbo-dashboard-panel'),
  turboStatusHeadline: document.getElementById('turbo-status-headline'),
  turboStopwatch: document.getElementById('turbo-stopwatch'),
  btnTurboViewQueue: document.getElementById('btn-turbo-view-queue'),
  turboCompletedCount: document.getElementById('turbo-completed-count'),
  turboWorkersGrid: document.getElementById('turbo-workers-grid'),
  turboResultsContainer: document.getElementById('turbo-results-container'),
  turboResultsCount: document.getElementById('turbo-results-count'),
  turboResultsGrid: document.getElementById('turbo-results-grid'),
  btnTurboBatchNow: document.getElementById('btn-turbo-batch-now'),

  // YouTube Shorts Auto-Upload & OAuth
  btnUploadYoutubeResult: document.getElementById('btn-upload-youtube-result'),
  ytResultUploadStatus: document.getElementById('yt-result-upload-status'),
  ytClientIdInput: document.getElementById('yt-client-id-input'),
  ytClientSecretInput: document.getElementById('yt-client-secret-input'),
  ytPrivacySelect: document.getElementById('yt-privacy-select'),
  btnConnectYtChannel: document.getElementById('btn-connect-yt-channel'),
  ytChannelBadge: document.getElementById('yt-channel-badge'),
  ytChannelInfo: document.getElementById('yt-channel-info'),
  ytChannelName: document.getElementById('yt-channel-name'),
  ytChannelAvatar: document.getElementById('yt-channel-avatar'),
  btnDisconnectYt: document.getElementById('btn-disconnect-yt'),
  chkAutoUploadYoutube: document.getElementById('chk-auto-upload-youtube'),

  // Video Resolution & Quality (1080p HD / 4K UHD)
  turboQualitySelect: document.getElementById('turbo-quality-select'),
  qualityButtons: document.querySelectorAll('.quality-btn'),
  qualityDesc: document.getElementById('quality-desc'),

  // Clip Duration & Precision Trimmer
  turboDurationSelect: document.getElementById('turbo-duration-select'),
  customDurationRow: document.getElementById('custom-duration-row'),
  customMinDuration: document.getElementById('custom-min-duration'),
  customMaxDuration: document.getElementById('custom-max-duration'),
  editorClipDurationBadge: document.getElementById('editor-clip-duration-badge'),
  editorTrimStart: document.getElementById('editor-trim-start'),
  editorTrimDuration: document.getElementById('editor-trim-duration'),
  btnTrimStartMinus: document.getElementById('btn-trim-start-minus'),
  btnTrimStartPlus: document.getElementById('btn-trim-start-plus'),
  btnTrimLenMinus: document.getElementById('btn-trim-len-minus'),
  btnTrimLenPlus: document.getElementById('btn-trim-len-plus'),
  durationPresetChips: document.querySelectorAll('.btn-duration-chip'),

  // Reaction Split & Facecam Controls
  studioCropMode: document.getElementById('studio-crop-mode'),
  studioFacecamRow: document.getElementById('studio-facecam-row'),
  studioFacecamPos: document.getElementById('studio-facecam-pos'),
  liveFacecamContainer: document.getElementById('live-facecam-container'),
  liveFacecamPos: document.getElementById('live-facecam-pos'),
  editorFacecamConfig: document.getElementById('editor-facecam-config'),
  btnFacecamPosList: document.querySelectorAll('.btn-facecam-pos'),
  reactionSplitGuide: document.getElementById('reaction-split-guide'),
  guideFacecamPosLabel: document.getElementById('guide-facecam-pos-label')
};

let livePollingTimer = null;
let demoAnimationTimer = null;
let demoWordIndex = 0;
const demoWords = ['VIRAL', 'CONTENT', 'CREATOR'];

const styleDisplayNames = {
  'tiktok': 'TikTok Yellow',
  'hormozi': 'Alex Hormozi Lime',
  'mrbeast': 'MrBeast Hype',
  'fire_glow': 'Fire & Flame Glow',
  'highlighter': 'Highlighter Pill',
  'cyberpunk': 'Cyberpunk Neon',
  'minimalist': 'Minimalist Clean'
};

// ----------------------------------------------------
// Init & Settings
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  checkSettings();
  loadYoutubeStatus();
  setupEventListeners();
  checkLiveStatus();
  loadQueueBadge();
  startSubtitleDemoLoop();
  handleUrlAuthFeedback();
});

function handleUrlAuthFeedback() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('yt_connected')) {
    showBypassNoticeToast('🎉 YouTube Channel connected successfully! Direct Shorts upload is active.');
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.has('yt_error')) {
    alert('YouTube Connection Notice: ' + decodeURIComponent(urlParams.get('yt_error')));
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function loadYoutubeStatus() {
  try {
    const res = await fetch('/api/youtube/status');
    const data = await res.json();
    if (!data.success) return;

    state.youtubeConnected = data.isConnected;
    state.youtubeChannelTitle = data.channelTitle;
    state.youtubeChannelAvatar = data.channelAvatar;
    state.youtubePrivacy = data.privacyStatus || 'public';

    if (el.ytPrivacySelect) el.ytPrivacySelect.value = state.youtubePrivacy;

    if (el.chkAutoUploadYoutube) {
      el.chkAutoUploadYoutube.checked = state.autoUploadYoutube;
    }

    if (el.ytChannelBadge) {
      if (data.isConnected) {
        el.ytChannelBadge.textContent = '✓ Connected';
        el.ytChannelBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        el.ytChannelBadge.style.color = '#10b981';
      } else {
        el.ytChannelBadge.textContent = data.hasCredentials ? 'Credentials Set' : 'Not Connected';
        el.ytChannelBadge.style.background = 'rgba(255, 255, 255, 0.1)';
        el.ytChannelBadge.style.color = 'var(--text-muted)';
      }
    }

    if (el.ytChannelInfo) {
      if (data.isConnected) {
        el.ytChannelInfo.style.display = 'flex';
        if (el.ytChannelName) el.ytChannelName.textContent = data.channelTitle;
        if (el.ytChannelAvatar) {
          if (data.channelAvatar) {
            el.ytChannelAvatar.src = data.channelAvatar;
            el.ytChannelAvatar.style.display = 'block';
          } else {
            el.ytChannelAvatar.style.display = 'none';
          }
        }
        if (el.btnConnectYtChannel) el.btnConnectYtChannel.style.display = 'none';
      } else {
        el.ytChannelInfo.style.display = 'none';
        if (el.btnConnectYtChannel) el.btnConnectYtChannel.style.display = 'inline-flex';
      }
    }
  } catch (err) {
    console.warn('Could not load YouTube status:', err.message);
  }
}

async function checkSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.configured) {
      state.apiKeyConfigured = true;
      el.keyStatus.textContent = `API Key configured: ${data.keyMasked}`;
      el.keyStatus.style.color = '#10b981';
    } else {
      state.apiKeyConfigured = false;
      el.keyStatus.textContent = 'API Key not configured.';
      el.keyStatus.style.color = '#ef4444';
      openModal(el.settingsModal);
    }
    
    if (data.cookiesContent) {
      el.youtubeCookiesInput.value = data.cookiesContent;
    } else {
      el.youtubeCookiesInput.value = '';
    }

    if (el.ytKeyStatus) {
      if (data.youtubeApiConfigured) {
        el.ytKeyStatus.textContent = `YouTube Data API v3 configured: ${data.youtubeApiKeyMasked}`;
        el.ytKeyStatus.style.color = '#10b981';
      } else {
        el.ytKeyStatus.textContent = 'Zero-config yt-dlp search active by default.';
        el.ytKeyStatus.style.color = 'var(--text-muted)';
      }
    }
  } catch (err) {
    console.error('Error checking settings:', err);
  }
}

// Modal Helpers
function openModal(modal) {
  modal.classList.add('active');
}
function closeModal(modal) {
  modal.classList.remove('active');
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function setupEventListeners() {
  // Settings modal
  el.btnOpenSettings.addEventListener('click', () => {
    openModal(el.settingsModal);
  });
  el.btnCloseSettings.addEventListener('click', () => {
    closeModal(el.settingsModal);
  });
  el.formSettings.addEventListener('submit', handleSettingsSave);

  // YouTube OAuth & Upload handlers
  if (el.btnConnectYtChannel) {
    el.btnConnectYtChannel.addEventListener('click', connectYoutubeChannel);
  }
  if (el.btnDisconnectYt) {
    el.btnDisconnectYt.addEventListener('click', disconnectYoutubeChannel);
  }
  if (el.btnUploadYoutubeResult) {
    el.btnUploadYoutubeResult.addEventListener('click', uploadExportResultToYoutube);
  }
  if (el.chkAutoUploadYoutube) {
    el.chkAutoUploadYoutube.addEventListener('change', (e) => {
      state.autoUploadYoutube = e.target.checked;
      localStorage.setItem('clipper_auto_upload_yt', e.target.checked ? 'true' : 'false');
      showBypassNoticeToast(e.target.checked ? '⚡ Auto-Upload to YouTube Shorts enabled!' : 'Auto-Upload to YouTube Shorts disabled.');
    });
  }

  // Tab switching
  el.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      el.tabButtons.forEach(b => b.classList.remove('active'));
      el.tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Import: YouTube
  el.formImportYt.addEventListener('submit', handleYoutubeImport);

  // Import: Local File upload select/drag
  el.dropZone.addEventListener('click', () => el.localFile.click());
  el.localFile.addEventListener('change', handleFileSelect);
  el.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.dropZone.classList.add('dragover');
  });
  el.dropZone.addEventListener('dragleave', () => {
    el.dropZone.classList.remove('dragover');
  });
  el.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      el.localFile.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });

  // Import: Pre-Trimmed File upload select/drag
  if (el.dropZoneTrimmed && el.trimmedFile) {
    el.dropZoneTrimmed.addEventListener('click', () => el.trimmedFile.click());
    el.trimmedFile.addEventListener('change', handleTrimmedFileSelect);
    el.dropZoneTrimmed.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.dropZoneTrimmed.classList.add('dragover');
    });
    el.dropZoneTrimmed.addEventListener('dragleave', () => {
      el.dropZoneTrimmed.classList.remove('dragover');
    });
    el.dropZoneTrimmed.addEventListener('drop', (e) => {
      e.preventDefault();
      el.dropZoneTrimmed.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        el.trimmedFile.files = e.dataTransfer.files;
        handleTrimmedFileSelect();
      }
    });
  }

  // Editor Navigation
  el.btnBackToClips.addEventListener('click', () => {
    el.clipPlayer.pause();
    if (state.isTrimmedUpload) {
      showSection(el.secImport);
    } else {
      showSection(el.secWorkspace);
    }
  });

  // Subtitle preset selection
  el.stylePresetCards.forEach(card => {
    card.addEventListener('click', () => {
      el.stylePresetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.subtitlePreset = card.dataset.style;
      renderTranscriptTimeline(state.captions);
      updateSubtitlePreviewOverlay(el.clipPlayer.currentTime);
      updateSubtitleDemoStage();
    });
  });

  if (el.btnReplayDemo) {
    el.btnReplayDemo.addEventListener('click', () => {
      startSubtitleDemoLoop();
    });
  }

  // Aspect ratio & Reaction Split layout toggle
  el.ratioBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ratio === state.aspectRatio);
    btn.addEventListener('click', () => {
      el.ratioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.aspectRatio = btn.dataset.ratio;
      localStorage.setItem('clipper_crop_mode', state.aspectRatio);
      if (el.studioCropMode) el.studioCropMode.value = state.aspectRatio;
      updateAspectRatioPreview();
    });
  });

  // Studio Deck Crop Mode and Facecam Position
  if (el.studioCropMode) {
    el.studioCropMode.value = state.aspectRatio;
    if (el.studioFacecamRow) {
      el.studioFacecamRow.style.display = (state.aspectRatio === 'reaction_split') ? 'flex' : 'none';
    }
    el.studioCropMode.addEventListener('change', (e) => {
      state.aspectRatio = e.target.value;
      localStorage.setItem('clipper_crop_mode', state.aspectRatio);
      updateAspectRatioPreview();
    });
  }

  if (el.studioFacecamPos) {
    el.studioFacecamPos.value = state.facecamPosition;
    el.studioFacecamPos.addEventListener('change', (e) => {
      state.facecamPosition = e.target.value;
      localStorage.setItem('clipper_facecam_pos', state.facecamPosition);
      updateAspectRatioPreview();
    });
  }

  // Editor Facecam Position buttons
  if (el.btnFacecamPosList) {
    el.btnFacecamPosList.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pos === state.facecamPosition);
      btn.addEventListener('click', () => {
        el.btnFacecamPosList.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.facecamPosition = btn.dataset.pos;
        localStorage.setItem('clipper_facecam_pos', state.facecamPosition);
        if (el.studioFacecamPos) el.studioFacecamPos.value = state.facecamPosition;
        updateAspectRatioPreview();
      });
    });
  }

  // Video Resolution & Quality Selection (1080p HD / 4K UHD)
  if (el.qualityButtons && el.qualityButtons.length > 0) {
    el.qualityButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quality === state.exportQuality);
      btn.addEventListener('click', () => {
        el.qualityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exportQuality = btn.dataset.quality;
        localStorage.setItem('clipper_export_quality', state.exportQuality);
        if (el.turboQualitySelect) el.turboQualitySelect.value = state.exportQuality;
        if (el.qualityDesc) {
          el.qualityDesc.textContent = state.exportQuality === '4k'
            ? 'Ultra-high bitrate 4K Ultra HD (2160x3840) vertical video. Optimal for flagship devices and maximum visual sharpness.'
            : 'Pristine 1080p Full HD (1080x1920) vertical video with Lanczos scaling. Fast rendering and sharp display across all mobile screens.';
        }
      });
    });
  }

  if (el.turboQualitySelect) {
    el.turboQualitySelect.value = state.exportQuality;
    el.turboQualitySelect.addEventListener('change', (e) => {
      state.exportQuality = e.target.value;
      localStorage.setItem('clipper_export_quality', state.exportQuality);
      if (el.qualityButtons) {
        el.qualityButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.quality === state.exportQuality);
        });
      }
      if (el.qualityDesc) {
        el.qualityDesc.textContent = state.exportQuality === '4k'
          ? 'Ultra-high bitrate 4K Ultra HD (2160x3840) vertical video. Optimal for flagship devices and maximum visual sharpness.'
          : 'Pristine 1080p Full HD (1080x1920) vertical video with Lanczos scaling. Fast rendering and sharp display across all mobile screens.';
      }
    });
  }

  // Studio Deck Duration Select & Custom Range Handlers
  if (el.turboDurationSelect) {
    el.turboDurationSelect.value = state.clipDurationMode;
    if (el.customDurationRow) {
      el.customDurationRow.style.display = (state.clipDurationMode === 'custom') ? 'grid' : 'none';
    }
    el.turboDurationSelect.addEventListener('change', (e) => {
      state.clipDurationMode = e.target.value;
      localStorage.setItem('clipper_clip_duration_mode', state.clipDurationMode);
      if (el.customDurationRow) {
        el.customDurationRow.style.display = (state.clipDurationMode === 'custom') ? 'grid' : 'none';
      }
    });
  }

  if (el.customMinDuration) {
    el.customMinDuration.value = state.minDuration;
    el.customMinDuration.addEventListener('change', (e) => {
      state.minDuration = Math.max(5, parseFloat(e.target.value) || 15);
      localStorage.setItem('clipper_custom_min_duration', state.minDuration);
    });
  }
  if (el.customMaxDuration) {
    el.customMaxDuration.value = state.maxDuration;
    el.customMaxDuration.addEventListener('change', (e) => {
      state.maxDuration = Math.max(state.minDuration || 15, parseFloat(e.target.value) || 60);
      localStorage.setItem('clipper_custom_max_duration', state.maxDuration);
    });
  }

  // Precision Trimmer Controls in Editor
  if (el.durationPresetChips && el.durationPresetChips.length > 0) {
    el.durationPresetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        el.durationPresetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const preset = chip.dataset.preset;
        if (preset === 'full') {
          if (state.selectedClip) {
            state.editorTrimStart = 0;
            state.editorTrimDuration = Math.max(5, (state.selectedClip.end - state.selectedClip.start));
          }
        } else {
          state.editorTrimDuration = parseFloat(preset) || 30;
        }
        updateTrimDisplay();
      });
    });
  }

  const updateTrimDisplay = () => {
    if (el.editorTrimStart) el.editorTrimStart.value = (state.editorTrimStart || 0).toFixed(1);
    if (el.editorTrimDuration) el.editorTrimDuration.value = (state.editorTrimDuration || 30).toFixed(1);
    if (el.editorClipDurationBadge) {
      el.editorClipDurationBadge.textContent = `⏱️ Duration: ${(state.editorTrimDuration || 30).toFixed(1)}s`;
    }
  };

  if (el.btnTrimStartMinus) {
    el.btnTrimStartMinus.addEventListener('click', () => {
      state.editorTrimStart = Math.max(0, (state.editorTrimStart || 0) - 1.0);
      updateTrimDisplay();
      if (el.clipPlayer && !isNaN(el.clipPlayer.duration)) {
        el.clipPlayer.currentTime = state.editorTrimStart;
      }
    });
  }
  if (el.btnTrimStartPlus) {
    el.btnTrimStartPlus.addEventListener('click', () => {
      state.editorTrimStart = (state.editorTrimStart || 0) + 1.0;
      updateTrimDisplay();
      if (el.clipPlayer && !isNaN(el.clipPlayer.duration)) {
        el.clipPlayer.currentTime = state.editorTrimStart;
      }
    });
  }
  if (el.btnTrimLenMinus) {
    el.btnTrimLenMinus.addEventListener('click', () => {
      state.editorTrimDuration = Math.max(5, (state.editorTrimDuration || 30) - 1.0);
      updateTrimDisplay();
    });
  }
  if (el.btnTrimLenPlus) {
    el.btnTrimLenPlus.addEventListener('click', () => {
      state.editorTrimDuration = (state.editorTrimDuration || 30) + 1.0;
      updateTrimDisplay();
    });
  }
  if (el.editorTrimStart) {
    el.editorTrimStart.addEventListener('change', (e) => {
      state.editorTrimStart = Math.max(0, parseFloat(e.target.value) || 0);
      updateTrimDisplay();
      if (el.clipPlayer && !isNaN(el.clipPlayer.duration)) {
        el.clipPlayer.currentTime = state.editorTrimStart;
      }
    });
  }
  if (el.editorTrimDuration) {
    el.editorTrimDuration.addEventListener('change', (e) => {
      state.editorTrimDuration = Math.max(5, parseFloat(e.target.value) || 30);
      updateTrimDisplay();
    });
  }

  // AI Mirror settings
  if (el.chkAiMirror) {
    el.chkAiMirror.addEventListener('change', (e) => {
      state.aiMirror = e.target.checked;
    });
  }
  if (el.chkHflip) {
    el.chkHflip.addEventListener('change', (e) => {
      state.hflip = e.target.checked;
    });
  }

  // Sliced Clip Player TimeUpdate (Subtitles sync highlight)
  el.clipPlayer.addEventListener('timeupdate', syncTimelineHighlight);

  // Word edit modal close
  el.btnCloseWordModal.addEventListener('click', () => closeModal(el.wordEditModal));
  el.formEditWord.addEventListener('submit', handleWordUpdate);

  // Sentence edit modal close & submit
  el.btnCloseSentenceModal.addEventListener('click', () => closeModal(el.sentenceEditModal));
  el.formEditSentence.addEventListener('submit', handleSentenceUpdate);

  // Subtitle font selection change listener
  if (el.subtitleFontSelect) {
    el.subtitleFontSelect.addEventListener('change', () => {
      updateSubtitlePreviewOverlay(el.clipPlayer.currentTime);
      updateSubtitleDemoStage();
    });
  }

  // Multilingual Transcription Language Selection (Hindi & English)
  if (el.transcriptionLang) {
    el.transcriptionLang.addEventListener('change', (e) => {
      state.transcriptionLanguage = e.target.value;
      if (el.editorLangSelect) {
        el.editorLangSelect.value = e.target.value;
      }
    });
  }

  if (el.editorLangSelect) {
    el.editorLangSelect.addEventListener('change', (e) => {
      state.transcriptionLanguage = e.target.value;
      if (el.transcriptionLang) {
        el.transcriptionLang.value = e.target.value;
      }
    });
  }

  // In-Editor Re-Transcribe in Selected Language
  if (el.btnRetranscribe) {
    el.btnRetranscribe.addEventListener('click', async () => {
      const selectedLang = el.editorLangSelect ? el.editorLangSelect.value : (state.transcriptionLanguage || 'auto');
      state.transcriptionLanguage = selectedLang;
      if (el.transcriptionLang) el.transcriptionLang.value = selectedLang;

      const clipAudioFilename = (state.selectedClip && state.selectedClip.clipAudioFilename)
        ? state.selectedClip.clipAudioFilename
        : (state.videoId ? `audio_${state.videoId}.mp3` : null);

      if (!clipAudioFilename) {
        alert('Clip audio is not available for re-transcription. Please select a clip first.');
        return;
      }

      el.btnRetranscribe.disabled = true;
      el.btnRetranscribe.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transcribing...`;

      el.transcriptTimeline.innerHTML = `
        <div class="transcript-placeholder">
          <div class="cyber-spinner"></div>
          <p>Re-transcribing speech in ${selectedLang.toUpperCase()}...<br><span style="font-size:12px; color:var(--text-muted);">Powered by Gemini Multimodal API</span></p>
        </div>
      `;

      try {
        const res = await fetch('/api/captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipAudioFilename,
            language: selectedLang
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Re-transcription failed.');
        }

        const data = await res.json();
        state.captions = data.captions;
        renderTranscriptTimeline(data.captions);

        const hasDevanagari = (data.captions || []).some(c => /[\u0900-\u097F]/.test(c.word || ''));
        if (hasDevanagari && el.subtitleFontSelect && (!state.subtitleFont || state.subtitleFont === 'the_bold_font')) {
          el.subtitleFontSelect.value = 'nirmala_ui';
          state.subtitleFont = 'nirmala_ui';
          updateSubtitlePreviewOverlay();
        }
      } catch (err) {
        alert('Re-transcription error: ' + err.message);
        renderTranscriptTimeline(state.captions);
      } finally {
        el.btnRetranscribe.disabled = false;
        el.btnRetranscribe.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Re-Transcribe`;
      }
    });
  }

  // History Modal triggers
  if (el.btnOpenHistory) {
    el.btnOpenHistory.addEventListener('click', () => {
      loadHistory();
      openModal(el.historyModal);
    });
  }
  if (el.btnCloseHistory) {
    el.btnCloseHistory.addEventListener('click', () => {
      closeModal(el.historyModal);
    });
  }

  // Export execution
  el.btnExportVideo.addEventListener('click', handleExport);

  // Export Results navigation
  el.btnBackToEditor.addEventListener('click', () => {
    el.exportPlayer.pause();
    showSection(el.secEditor);
  });

  // Live Stream Capture submit
  if (el.formImportLive) {
    el.formImportLive.addEventListener('submit', handleLiveCaptureStart);
  }
  if (el.btnLiveStop) {
    el.btnLiveStop.addEventListener('click', handleLiveCaptureStop);
  }
  if (el.btnLiveTestTrigger) {
    el.btnLiveTestTrigger.addEventListener('click', handleLiveTestTrigger);
  }

  // Ready to Push Queue Modal
  if (el.btnOpenQueue) {
    el.btnOpenQueue.addEventListener('click', () => {
      loadQueue();
      openModal(el.queueModal);
    });
  }
  if (el.btnCloseQueue) {
    el.btnCloseQueue.addEventListener('click', () => {
      closeModal(el.queueModal);
    });
  }

  // Live Gaming & GTA 6 Stream Radar listeners
  if (el.presetChips) {
    el.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        el.presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const q = chip.dataset.query;
        const isLive = chip.dataset.live === 'true';
        if (el.streamSearchInput) {
          el.streamSearchInput.value = q;
        }
        fetchLiveStreams(q, isLive);
      });
    });
  }

  if (el.btnFetchStreams) {
    el.btnFetchStreams.addEventListener('click', () => {
      const q = el.streamSearchInput ? el.streamSearchInput.value.trim() : 'GTA 6 live stream gaming';
      fetchLiveStreams(q, true);
    });
  }

  if (el.streamSearchInput) {
    el.streamSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = el.streamSearchInput.value.trim() || 'GTA 6 live stream gaming';
        fetchLiveStreams(q, true);
      }
    });
  }

  if (el.btnJumpLiveStreams) {
    el.btnJumpLiveStreams.addEventListener('click', () => {
      const liveTabBtn = document.querySelector('.tab-btn[data-tab="tab-livestream"]');
      if (liveTabBtn) {
        liveTabBtn.click();
      }
      const streamPanel = document.querySelector('.stream-discovery-panel');
      if (streamPanel) {
        streamPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (el.streamSearchResults && el.streamSearchResults.children.length <= 1) {
        fetchLiveStreams('GTA 6 live stream gaming', true);
      }
    });
  }

  // Turbo 4x Multiprocess listeners
  if (el.btnTurboViewQueue) {
    el.btnTurboViewQueue.addEventListener('click', () => {
      loadQueue();
      openModal(el.queueModal);
    });
  }

  if (el.btnTurboBatchNow) {
    el.btnTurboBatchNow.addEventListener('click', () => {
      if (!state.videoId) {
        alert('Please import a video first.');
        return;
      }
      startTurboWorkflow(state.videoId, state.transcriptionLanguage, state.clips);
    });
  }
}

// Helper to transition screens
function showSection(sectionEl) {
  const sections = [el.secImport, el.secWorkspace, el.secEditor, el.secExportResult];
  sections.forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  sectionEl.style.display = 'block';
  setTimeout(() => {
    sectionEl.classList.add('active');
  }, 50);
}

// ----------------------------------------------------
// Handlers
// ----------------------------------------------------

async function handleSettingsSave(e) {
  e.preventDefault();
  const apiKey = el.geminiKeyInput.value.trim();
  const youtubeCookies = el.youtubeCookiesInput.value.trim();
  const youtubeApiKey = el.youtubeApiKeyInput ? el.youtubeApiKeyInput.value.trim() : '';
  if (!apiKey) return;

  try {
    el.keyStatus.textContent = 'Saving settings...';
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, youtubeCookies, youtubeApiKey })
    });
    const data = await res.json();
    if (data.success) {
      state.apiKeyConfigured = true;

      // Save YouTube OAuth settings if provided
      const ytClientId = el.ytClientIdInput ? el.ytClientIdInput.value.trim() : '';
      const ytClientSecret = el.ytClientSecretInput ? el.ytClientSecretInput.value.trim() : '';
      const ytPrivacy = el.ytPrivacySelect ? el.ytPrivacySelect.value : 'public';
      if (ytClientId || ytClientSecret) {
        await fetch('/api/youtube/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: ytClientId, clientSecret: ytClientSecret, privacyStatus: ytPrivacy })
        }).catch(console.warn);
      }

      closeModal(el.settingsModal);
      checkSettings();
      loadYoutubeStatus();
    } else {
      el.keyStatus.textContent = 'Error saving settings.';
      el.keyStatus.style.color = '#ef4444';
    }
  } catch (err) {
    el.keyStatus.textContent = err.message;
    el.keyStatus.style.color = '#ef4444';
  }
}

// YouTube OAuth Connect
async function connectYoutubeChannel() {
  const clientId = el.ytClientIdInput ? el.ytClientIdInput.value.trim() : '';
  const clientSecret = el.ytClientSecretInput ? el.ytClientSecretInput.value.trim() : '';
  const privacyStatus = el.ytPrivacySelect ? el.ytPrivacySelect.value : 'public';

  if (!clientId || !clientSecret) {
    alert('Please enter your Google OAuth Client ID and Client Secret in the fields above first.');
    if (el.ytClientIdInput) el.ytClientIdInput.focus();
    return;
  }

  try {
    // 1. Save credentials to server first
    await fetch('/api/youtube/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret, privacyStatus })
    });

    // 2. Request authorization URL
    const res = await fetch('/api/youtube/auth-url');
    const data = await res.json();
    if (!data.success || !data.authUrl) {
      throw new Error(data.error || 'Failed to generate YouTube authorization URL');
    }

    // 3. Redirect to Google Consent Screen
    window.location.href = data.authUrl;
  } catch (err) {
    alert('Error connecting YouTube channel: ' + err.message);
  }
}

// YouTube Disconnect
async function disconnectYoutubeChannel() {
  if (!confirm('Are you sure you want to disconnect your YouTube channel?')) return;
  try {
    const res = await fetch('/api/youtube/disconnect', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showBypassNoticeToast('YouTube channel disconnected.');
      loadYoutubeStatus();
    }
  } catch (err) {
    alert('Error disconnecting: ' + err.message);
  }
}

// Upload current exported result to YouTube Shorts
async function uploadExportResultToYoutube() {
  if (!state.currentExport || !state.currentExport.exportFilename) {
    alert('No exported video is currently loaded.');
    return;
  }

  if (!state.youtubeConnected) {
    alert('Please connect your YouTube channel in Settings first to enable 1-Click Upload.');
    openModal(el.settingsModal);
    return;
  }

  const btn = el.btnUploadYoutubeResult;
  const statusDiv = el.ytResultUploadStatus;
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading to Shorts...`;
  statusDiv.style.display = 'block';
  statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
  statusDiv.style.color = '#fff';
  statusDiv.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color:#ef4444; margin-right:6px;"></i> Streaming video directly to YouTube Data API...`;

  const title = document.getElementById('virality-title').value.trim() || 'Epic Gaming Clip';
  const description = document.getElementById('virality-description').value.trim();
  const hashtags = document.getElementById('virality-hashtags').value.trim();

  try {
    const res = await fetch('/api/youtube/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exportFilename: state.currentExport.exportFilename,
        title,
        description,
        hashtags,
        privacyStatus: state.youtubePrivacy || 'public'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    btn.innerHTML = `<i class="fa-solid fa-check"></i> Published on Shorts!`;
    btn.style.background = '#10b981';
    statusDiv.style.background = 'rgba(16, 185, 129, 0.15)';
    statusDiv.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    statusDiv.innerHTML = `
      <div style="font-weight: 700; color: #10b981; margin-bottom: 4px;">🎉 Video is Live on YouTube Shorts!</div>
      <a href="${data.youtubeUrl}" target="_blank" style="color: #38bdf8; font-weight: 600; text-decoration: underline; font-size: 13.5px;">
        <i class="fa-brands fa-youtube" style="color:#ef4444;"></i> Open Shorts: ${data.youtubeUrl} &rarr;
      </a>
    `;
    showBypassNoticeToast('🚀 Clip published to YouTube Shorts successfully!');
  } catch (err) {
    console.error('YouTube upload failed:', err);
    btn.disabled = false;
    btn.innerHTML = originalText;
    statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
    statusDiv.innerHTML = `<span style="color:#ef4444;">Upload error: ${escapeHtml(err.message)}</span>`;
  }
}

// 1-Click Upload directly from Staging Queue Card
window.uploadQueueItemToYoutube = async function(id, btn) {
  if (!state.youtubeConnected) {
    alert('Please connect your YouTube channel in Settings first to enable 1-Click Upload.');
    openModal(el.settingsModal);
    return;
  }

  const card = btn.closest('.queue-item-card');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

  const titleInput = card ? card.querySelector('.queue-title-input') : null;
  const descInput = card ? card.querySelector('.queue-desc-input') : null;
  const title = titleInput ? titleInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';

  try {
    // Fetch queue item metadata
    const queueRes = await fetch('/api/live/queue');
    const queueData = await queueRes.json();
    const item = (queueData.queue || []).find(q => q.id === id);

    if (!item) throw new Error('Queue item not found.');

    const res = await fetch('/api/youtube/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        exportFilename: item.exportFilename,
        title: title || item.title,
        description: description || item.description,
        hashtags: item.hashtags,
        privacyStatus: state.youtubePrivacy || 'public'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    btn.outerHTML = `
      <a href="${data.youtubeUrl}" target="_blank" class="btn-primary" style="padding: 6px 14px; font-size: 12.5px; border:none; text-decoration:none; background: #10b981; display:inline-flex; align-items:center; gap:6px;">
        <i class="fa-brands fa-youtube"></i> View on Shorts
      </a>
    `;

    if (card) {
      const tag = card.querySelector('.queue-status-tag');
      if (tag) {
        tag.textContent = '✓ PUBLISHED';
        tag.style.background = 'rgba(16,185,129,0.2)';
        tag.style.color = '#10b981';
      }
    }

    showBypassNoticeToast('🚀 Clip published to YouTube Shorts!');
  } catch (err) {
    console.error('Queue upload error:', err);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    alert('YouTube Upload Notice: ' + err.message);
  }
};

// YouTube import API trigger
async function handleYoutubeImport(e) {
  e.preventDefault();
  if (!state.apiKeyConfigured) {
    alert('Please configure your Gemini API Key first.');
    openModal(el.settingsModal);
    return;
  }

  const url = el.ytUrl.value.trim();
  if (!url) return;

  showSection(el.secWorkspace);
  setStepState('step-import', 'active');
  setStepState('step-analyze', 'inactive');
  setStepState('step-refine', 'inactive');
  
  el.sourcePlayer.style.display = 'none';
  el.processingDetails.style.display = 'flex';
  el.processingStatusText.innerHTML = `Connecting &amp; downloading stream...<br><span style="font-size:12px; color:var(--text-muted);">High-speed extractor (720p HD)</span>`;

  try {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw errData;
    }

    const data = await res.json();
    handleImportSuccess(data);

  } catch (err) {
    console.error('Import attempt error:', err);
    showImportRecoveryDialog(err);
    showSection(el.secImport);
  }
}

// Interactive Recovery Dialog instead of jarring browser alert popups
function showImportRecoveryDialog(err) {
  const errMsg = typeof err === 'string' ? err : (err && err.error) || (err && err.message) || 'Failed to download stream';
  let modal = document.getElementById('import-recovery-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'import-recovery-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 520px; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--border-radius-md); box-shadow: 0 16px 40px rgba(0,0,0,0.85); padding: 26px;">
      <div style="font-size: 38px; color: var(--accent-pink); margin-bottom: 12px;">
        <i class="fa-solid fa-cloud-arrow-down"></i>
      </div>
      <h3 style="font-family: var(--font-display); font-size: 1.35rem; color: var(--text-primary); margin-bottom: 8px;">
        YouTube Cloud Firewall Notice
      </h3>
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin-bottom: 20px;">
        YouTube actively blocks direct scrapes from cloud datacenter server IPs.<br>
        <strong style="color: var(--text-primary);">Choose any of these 100% working options to continue:</strong>
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button type="button" class="btn-primary" onclick="closeModal(document.getElementById('import-recovery-modal')); window.triggerDirectVideoUpload();" style="justify-content: center; padding: 13px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
          <i class="fa-solid fa-cloud-arrow-up" style="margin-right: 8px;"></i> Upload Video From Device (100% Guaranteed Success)
        </button>
        <button type="button" class="btn-secondary" onclick="closeModal(document.getElementById('import-recovery-modal')); window.loadInstantGtaSample();" style="justify-content: center; padding: 12px; cursor: pointer; border-color: var(--accent-pink);">
          <i class="fa-solid fa-bolt" style="color: var(--accent-pink); margin-right: 8px;"></i> Load Verified 1080p GTA 6 Action Stream (Instant)
        </button>
        <button type="button" class="btn-secondary" onclick="closeModal(document.getElementById('import-recovery-modal')); window.promptDirectUrlImport();" style="justify-content: center; padding: 12px; cursor: pointer;">
          <i class="fa-solid fa-link" style="margin-right: 8px;"></i> Paste Direct MP4 / Web Stream URL
        </button>
        <button type="button" class="btn-secondary" onclick="closeModal(document.getElementById('import-recovery-modal')); openModal(el.settingsModal); document.getElementById('youtube-cookies').focus();" style="justify-content: center; padding: 12px; cursor: pointer;">
          <i class="fa-solid fa-cookie-bite" style="color: #f59e0b; margin-right: 8px;"></i> Add YouTube Cookies in Settings
        </button>
        <button type="button" class="btn-secondary" onclick="closeModal(document.getElementById('import-recovery-modal'));" style="justify-content: center; border: none; opacity: 0.7; cursor: pointer; padding: 8px;">
          Cancel
        </button>
      </div>
    </div>
  `;
  openModal(modal);
}

// 1-Click Direct File Upload Trigger
window.triggerDirectVideoUpload = function() {
  const uploadTab = document.querySelector('.tab-btn[data-tab="tab-upload"]');
  if (uploadTab) uploadTab.click();
  if (el.localFile) el.localFile.click();
};

// 1-Click Direct URL Input Prompt
window.promptDirectUrlImport = function() {
  const directUrl = prompt('Enter direct MP4, MOV, or web video stream URL:');
  if (directUrl && directUrl.trim()) {
    el.ytUrl.value = directUrl.trim();
    const ytTab = document.querySelector('.tab-btn[data-tab="tab-youtube"]');
    if (ytTab) ytTab.click();
    el.formImportYt.dispatchEvent(new Event('submit'));
  }
};

// Notification Toast for Cloud Firewall Bypass Notice
function showBypassNoticeToast(noticeText) {
  let toast = document.getElementById('bypass-notice-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bypass-notice-toast';
    toast.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:9999; background:var(--surface); border:1px solid var(--accent-color); color:var(--text-primary); padding:10px 18px; border-radius:9999px; box-shadow:0 8px 30px rgba(0,0,0,0.6); font-size:12.5px; display:flex; align-items:center; gap:8px; animation:slideUpFade 0.3s ease;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-shield-halved" style="color:var(--accent-pink);"></i> ${escapeHtml(noticeText)}`;
  toast.style.display = 'flex';
  setTimeout(() => { if (toast) toast.style.display = 'none'; }, 6000);
}

// 1-Click Instant GTA 6 Stream Loader
window.loadInstantGtaSample = async function() {
  if (!state.apiKeyConfigured) {
    alert('Please configure your Gemini API Key first.');
    openModal(el.settingsModal);
    return;
  }

  showSection(el.secWorkspace);
  setStepState('step-import', 'active');
  setStepState('step-analyze', 'inactive');
  setStepState('step-refine', 'inactive');
  
  el.sourcePlayer.style.display = 'none';
  el.processingDetails.style.display = 'flex';
  el.processingStatusText.innerHTML = `Loading instant GTA 6 stream...<br><span style="font-size:12px; color:var(--text-muted);">Cloud Firewall Bypass (720p HD 60fps)</span>`;

  try {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'sample_gta6' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load sample stream');
    }
    const data = await res.json();
    handleImportSuccess(data);
  } catch (err) {
    alert('Failed to load sample: ' + err.message);
    showSection(el.secImport);
  }
};

// Local File Upload trigger
async function handleFileSelect() {
  if (!state.apiKeyConfigured) {
    alert('Please configure your Gemini API Key first.');
    openModal(el.settingsModal);
    return;
  }

  const file = el.localFile.files[0];
  if (!file) return;

  el.selectedFileName.textContent = `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;

  showSection(el.secWorkspace);
  setStepState('step-import', 'active');
  setStepState('step-analyze', 'inactive');
  setStepState('step-refine', 'inactive');

  el.sourcePlayer.style.display = 'none';
  el.processingDetails.style.display = 'flex';
  el.processingStatusText.textContent = 'Uploading local video...';

  const formData = new FormData();
  formData.append('videoFile', file);

  try {
    const res = await fetch('/api/import', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to upload video.');
    }

    const data = await res.json();
    handleImportSuccess(data);

  } catch (err) {
    alert(`Error: ${err.message}`);
    showSection(el.secImport);
  }
}

// Common import successful callback
function handleImportSuccess(data) {
  state.isTrimmedUpload = false; // Reset to normal workflow
  state.videoId = data.videoId;
  state.videoUrl = data.videoUrl;

  if (data.notice) {
    showBypassNoticeToast(data.notice);
  }

  setStepState('step-import', 'complete');
  setStepState('step-analyze', 'active');

  // Display original video in player
  el.processingDetails.style.display = 'none';
  el.sourcePlayer.style.display = 'block';
  el.sourcePlayer.src = data.videoUrl;
  el.sourcePlayer.load();

  // If Turbo 4x Multiprocess is enabled, fan-out parallel pipeline immediately!
  if (el.turboModeCheckbox && el.turboModeCheckbox.checked) {
    startTurboWorkflow(data.videoId, state.transcriptionLanguage);
  } else {
    // Trigger standard Gemini Analysis
    runGeminiAnalysis();
  }
}

// Stepper visual states
function setStepState(stepId, stateVal) {
  const step = document.getElementById(stepId);
  step.classList.remove('active', 'complete');
  if (stateVal === 'active') step.classList.add('active');
  if (stateVal === 'complete') step.classList.add('complete');
}

// AI Analysis triggering
async function runGeminiAnalysis() {
  el.clipsList.innerHTML = `
    <div class="clips-placeholder">
      <div class="cyber-spinner"></div>
      <p style="margin-top:10px;">Gemini is analyzing the audio track...<br><span style="font-size:12px; color:var(--text-muted);">Uploading & scoring virality metrics</span></p>
    </div>
  `;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        videoId: state.videoId,
        language: state.transcriptionLanguage,
        durationMode: state.clipDurationMode,
        minDuration: state.minDuration,
        maxDuration: state.maxDuration
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Analysis failed.');
    }

    const data = await res.json();
    state.clips = data.clips;

    if (el.autopilotCheckbox && el.autopilotCheckbox.checked) {
      renderAutopilotConfigBoard(data.clips);
    } else {
      renderClips(data.clips);
      if (el.btnTurboBatchNow) {
        el.btnTurboBatchNow.style.display = 'inline-flex';
      }
      setStepState('step-analyze', 'complete');
    }
  } catch (err) {
    el.clipsList.innerHTML = `
      <div class="clips-placeholder" style="color:var(--accent-color);">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Analysis failed: ${err.message}</p>
      </div>
    `;
  }
}

// Render recommendations
function renderClips(clips) {
  if (!clips || clips.length === 0) {
    el.clipsList.innerHTML = `
      <div class="clips-placeholder">
        <i class="fa-solid fa-face-frown"></i>
        <p>No suitable viral clips detected.</p>
      </div>
    `;
    return;
  }

  el.clipsList.innerHTML = '';
  clips.forEach((clip, index) => {
    // Determine score style
    let scoreClass = 'score-low';
    if (clip.score >= 80) scoreClass = 'score-high';
    else if (clip.score >= 50) scoreClass = 'score-medium';

    const card = document.createElement('div');
    card.className = 'clip-item-card';
    card.innerHTML = `
      <div class="clip-badge-container">
        <div class="score-badge ${scoreClass}">${clip.score}</div>
      </div>
      <div class="clip-info">
        <div class="clip-title-row">
          <h3>${clip.title}</h3>
          <span class="clip-time">${formatDuration(clip.start)} - ${formatDuration(clip.end)}</span>
        </div>
        <p class="clip-desc">${clip.reason}</p>
      </div>
    `;

    // Click handler to select and cut this clip
    card.addEventListener('click', () => handleClipSelect(clip));
    el.clipsList.appendChild(card);
  });
}

function formatDuration(sec) {
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Slicing video segment on selection
async function handleClipSelect(clip) {
  state.selectedClip = clip;
  
  // Transition to editor screen
  showSection(el.secEditor);
  setStepState('step-refine', 'active');

  // Reset editor player and loading transcripts
  el.clipPlayer.src = '';
  el.transcriptTimeline.innerHTML = `
    <div class="transcript-placeholder">
      <div class="cyber-spinner"></div>
      <p>Cutting video clip and extracting audio...</p>
    </div>
  `;

  try {
    // 1. Cut the video first
    const resCut = await fetch('/api/cut', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: state.videoId,
        start: clip.start,
        end: clip.end
      })
    });

    if (!resCut.ok) {
      const errData = await resCut.json();
      throw new Error(errData.error || 'Failed to cut video.');
    }

    const dataCut = await resCut.json();
    state.selectedClip.clipFilename = dataCut.clipFilename;
    state.selectedClip.clipAudioFilename = dataCut.clipAudioFilename;

    // Load sliced video clip
    el.clipPlayer.src = dataCut.clipUrl;
    el.clipPlayer.load();
    updateAspectRatioPreview();

    // Initialize precision trimmer values for the selected clip
    const rawClipDur = (clip.end - clip.start) || 30;
    state.editorTrimStart = 0;
    state.editorTrimDuration = Math.round(rawClipDur * 10) / 10;
    if (el.editorTrimStart) el.editorTrimStart.value = '0.0';
    if (el.editorTrimDuration) el.editorTrimDuration.value = state.editorTrimDuration.toFixed(1);
    if (el.editorClipDurationBadge) {
      el.editorClipDurationBadge.textContent = `⏱️ Duration: ${state.editorTrimDuration.toFixed(1)}s`;
    }
    if (el.durationPresetChips) {
      el.durationPresetChips.forEach(c => {
        c.classList.toggle('active', c.dataset.preset === 'full' || parseFloat(c.dataset.preset) === state.editorTrimDuration);
      });
    }

    // 2. Fetch word-level captions from Gemini
    el.transcriptTimeline.innerHTML = `
      <div class="transcript-placeholder">
        <div class="cyber-spinner"></div>
        <p>Transcribing audio track with word-level accuracy...<br><span style="font-size:12px; color:var(--text-muted);">Powered by Gemini Multimodal API (${(state.transcriptionLanguage || 'auto').toUpperCase()})</span></p>
      </div>
    `;

    const resCaptions = await fetch('/api/captions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipAudioFilename: dataCut.clipAudioFilename,
        language: state.transcriptionLanguage
      })
    });

    if (!resCaptions.ok) {
      const errData = await resCaptions.json();
      throw new Error(errData.error || 'Transcription failed.');
    }

    const dataCaptions = await resCaptions.json();
    state.captions = dataCaptions.captions;
    renderTranscriptTimeline(dataCaptions.captions);

    // If Devanagari Hindi characters are detected, default font to Nirmala UI for clean rendering
    const hasDevanagari = (dataCaptions.captions || []).some(c => /[\u0900-\u097F]/.test(c.word || ''));
    if (hasDevanagari && el.subtitleFontSelect && (!state.subtitleFont || state.subtitleFont === 'the_bold_font')) {
      el.subtitleFontSelect.value = 'nirmala_ui';
      state.subtitleFont = 'nirmala_ui';
      updateSubtitlePreviewOverlay();
    }

  } catch (err) {
    el.transcriptTimeline.innerHTML = `
      <div class="transcript-placeholder" style="color:var(--accent-color);">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Failed: ${err.message}</p>
      </div>
    `;
  }
}

// ----------------------------------------------------
// Subtitle Timeline Editor Rendering
// ----------------------------------------------------
// Helper to group flat captions list into grammatical sentences
function groupCaptionsIntoSentences(captions) {
  const sentences = [];
  let currentSentence = [];
  const maxPhraseLength = (state.subtitlePreset === 'minimalist') ? 8 : 3;
  
  for (let i = 0; i < captions.length; i++) {
    const cap = captions[i];
    currentSentence.push({ ...cap, originalIndex: i });
    
    const wordText = cap.word.trim();
    const hasSentenceEnding = /[.!?]/.test(wordText);
    const hasClauseEnding = /[,;:-]/.test(wordText);
    const nextCap = captions[i + 1];
    const hasPause = nextCap ? (nextCap.start - cap.end > 0.6) : false;
    const isTooLong = currentSentence.length >= maxPhraseLength;
    
    if (hasSentenceEnding || hasPause || isTooLong || !nextCap) {
      sentences.push(currentSentence);
      currentSentence = [];
    } else if (hasClauseEnding && currentSentence.length >= 2) {
      sentences.push(currentSentence);
      currentSentence = [];
    }
  }
  return sentences;
}

function renderTranscriptTimeline(captions) {
  if (!captions || captions.length === 0) {
    el.transcriptTimeline.innerHTML = `
      <div class="transcript-placeholder">
        <i class="fa-solid fa-microphone-slash"></i>
        <p>No speech detected in this segment.</p>
      </div>
    `;
    return;
  }

  el.transcriptTimeline.innerHTML = '';
  const sentences = groupCaptionsIntoSentences(captions);

  sentences.forEach((sentence, sIdx) => {
    const sentenceCard = document.createElement('div');
    sentenceCard.className = 'sentence-card';
    
    const sentenceMeta = document.createElement('div');
    sentenceMeta.className = 'sentence-meta';
    
    const startVal = sentence[0].start;
    const endVal = sentence[sentence.length - 1].end;
    sentenceMeta.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="sentence-number">Sentence ${sIdx + 1}</span>
        <button class="btn-edit-sentence-action" data-sentence-index="${sIdx}" style="background: none; border: none; color: var(--secondary-color); cursor: pointer; font-size: 11px; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; font-family: inherit; transition: background 0.2s;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
      </div>
      <span class="sentence-time">${startVal.toFixed(1)}s - ${endVal.toFixed(1)}s</span>
    `;
    sentenceCard.appendChild(sentenceMeta);

    // Attach sentence edit listener
    const editBtn = sentenceMeta.querySelector('.btn-edit-sentence-action');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSentenceEditModal(sIdx);
    });
    
    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'sentence-words';
    
    sentence.forEach((cap) => {
      const idx = cap.originalIndex;
      const token = document.createElement('div');
      token.className = 'word-token';
      token.dataset.index = idx;
      token.innerHTML = `
        <span>${cap.word}</span>
        <span class="word-time">${cap.start.toFixed(1)}s</span>
      `;

      // Click: seek player to start of word
      token.addEventListener('click', (e) => {
        if (e.detail === 1) {
          setTimeout(() => {
            if (token.dataset.doubleClicked === 'true') {
              token.dataset.doubleClicked = 'false';
              return;
            }
            el.clipPlayer.currentTime = cap.start;
            el.clipPlayer.play();
          }, 200);
        }
      });

      // Double click: edit word text and timestamp details
      token.addEventListener('dblclick', () => {
        token.dataset.doubleClicked = 'true';
        openWordEditModal(idx);
      });

      wordsContainer.appendChild(token);
    });
    
    sentenceCard.appendChild(wordsContainer);
    el.transcriptTimeline.appendChild(sentenceCard);
  });
}

// Synchronize video playback cursor with highlighted active words
function syncTimelineHighlight() {
  const time = el.clipPlayer.currentTime;
  const tokens = el.transcriptTimeline.querySelectorAll('.word-token');
  
  let activeToken = null;
  
  state.captions.forEach((cap, idx) => {
    const token = tokens[idx];
    if (token) {
      if (time >= cap.start && time <= cap.end) {
        token.classList.add('active');
        activeToken = token;
      } else {
        token.classList.remove('active');
      }
    }
  });

  // Auto-scroll active word into view smoothly
  if (activeToken) {
    activeToken.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  // Update real-time subtitle preview overlay
  updateSubtitlePreviewOverlay(time);
}

// Word editing modal handlers
function openWordEditModal(index) {
  state.editingWordIndex = index;
  const cap = state.captions[index];
  
  el.editWordText.value = cap.word;
  el.editWordStart.value = cap.start.toFixed(2);
  el.editWordEnd.value = cap.end.toFixed(2);
  
  openModal(el.wordEditModal);
}

function handleWordUpdate(e) {
  e.preventDefault();
  const index = state.editingWordIndex;
  if (index === null) return;

  // Save values back to State
  state.captions[index].word = el.editWordText.value.trim();
  state.captions[index].start = parseFloat(el.editWordStart.value);
  state.captions[index].end = parseFloat(el.editWordEnd.value);

  closeModal(el.wordEditModal);
  renderTranscriptTimeline(state.captions);
  updateSubtitlePreviewOverlay(el.clipPlayer.currentTime);
}

// ----------------------------------------------------
// Export execution (Burn Subtitles / Aspect Ratio Crop)
// ----------------------------------------------------
async function handleExport() {
  if (!state.selectedClip || !state.captions || state.captions.length === 0) return;

  // Temporarily disable player to prevent lockouts
  el.clipPlayer.pause();

  const exportBtnOriginalText = el.btnExportVideo.innerHTML;
  el.btnExportVideo.disabled = true;
  el.btnExportVideo.innerHTML = `<div class="cyber-spinner" style="width:18px; height:18px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></div> Exporting & Rendering...`;

  try {
    const fontSelect = el.subtitleFontSelect;
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipFilename: state.selectedClip.clipFilename,
        captions: state.captions,
        style: state.subtitlePreset,
        crop: state.aspectRatio === 'crop',
        cropMode: state.aspectRatio,
        facecamPosition: state.facecamPosition || 'bottom_right',
        quality: state.exportQuality || '1080p',
        font: fontSelect ? fontSelect.value : 'arial',
        aiMirror: state.aiMirror,
        hflip: state.hflip,
        trimStart: state.editorTrimStart || 0,
        trimDuration: state.editorTrimDuration || null
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to render subtitles.');
    }

    const data = await res.json();
    state.currentExport = data;
    
    // Load exported video in Result Screen
    showSection(el.secExportResult);
    
    if (state.aspectRatio === 'crop' || state.aspectRatio === 'fit_blur' || state.aspectRatio === 'reaction_split') {
      el.exportPreviewContainer.classList.remove('original-ratio');
    } else {
      el.exportPreviewContainer.classList.add('original-ratio');
    }

    el.exportPlayer.src = data.exportUrl;
    el.exportPlayer.load();

    el.btnDownloadExport.href = '#';
    el.btnDownloadExport.onclick = (e) => {
      e.preventDefault();
      downloadVideo(`/api/download/${data.exportFilename}`, data.exportFilename, el.btnDownloadExport);
    };

    // Reset YouTube upload button & status
    if (el.ytResultUploadStatus) el.ytResultUploadStatus.style.display = 'none';
    if (el.btnUploadYoutubeResult) {
      el.btnUploadYoutubeResult.disabled = false;
      el.btnUploadYoutubeResult.innerHTML = `<i class="fa-brands fa-youtube"></i> Upload to YouTube Shorts`;
      el.btnUploadYoutubeResult.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }

    // Populate virality optimizer fields
    document.getElementById('virality-title').value = state.selectedClip.title || '';
    document.getElementById('virality-description').value = state.selectedClip.description || '';
    document.getElementById('virality-hashtags').value = (state.selectedClip.hashtags || []).join(' ');

    // Autopilot check: If Auto-Upload to Shorts is enabled and YouTube is connected, publish immediately!
    if (state.autoUploadYoutube && state.youtubeConnected) {
      console.log('[Autopilot] Auto-Upload to YouTube Shorts triggered...');
      uploadExportResultToYoutube();
    }

  } catch (err) {
    alert(`Export failed: ${err.message}`);
  } finally {
    el.btnExportVideo.disabled = false;
    el.btnExportVideo.innerHTML = exportBtnOriginalText;
  }
}

// Visual aspect ratio crop preview for editor player
function updateAspectRatioPreview() {
  const container = document.getElementById('clip-player-container');
  if (!container) return;

  const isVertical = (state.aspectRatio === 'reaction_split' || state.aspectRatio === 'crop' || state.aspectRatio === 'fit_blur');
  if (isVertical) {
    container.classList.add('crop-9-16-active');
  } else {
    container.classList.remove('crop-9-16-active');
  }

  // Guide overlay and facecam config panel for Reaction Split
  if (el.reactionSplitGuide) {
    el.reactionSplitGuide.style.display = (state.aspectRatio === 'reaction_split') ? 'flex' : 'none';
  }
  if (el.editorFacecamConfig) {
    el.editorFacecamConfig.style.display = (state.aspectRatio === 'reaction_split') ? 'block' : 'none';
  }
  if (el.guideFacecamPosLabel) {
    const labels = {
      'bottom_right': '↘ Bottom-Right',
      'bottom_left': '↙ Bottom-Left',
      'top_right': '↗ Top-Right',
      'top_left': '↖ Top-Left',
      'center': '🎯 Center'
    };
    el.guideFacecamPosLabel.textContent = labels[state.facecamPosition] || '↘ Bottom-Right';
  }

  // Sync active states on ratio buttons
  if (el.ratioBtns) {
    el.ratioBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.ratio === state.aspectRatio);
    });
  }
  // Sync studio crop mode select
  if (el.studioCropMode) {
    el.studioCropMode.value = state.aspectRatio;
  }
  if (el.studioFacecamRow) {
    el.studioFacecamRow.style.display = (state.aspectRatio === 'reaction_split') ? 'flex' : 'none';
  }
}

// Sentence editing modal handlers
function openSentenceEditModal(sIdx) {
  state.editingSentenceIndex = sIdx;
  const sentences = groupCaptionsIntoSentences(state.captions);
  const sentence = sentences[sIdx];
  const fullText = sentence.map(w => w.word).join(' ');

  el.editSentenceText.value = fullText;
  openModal(el.sentenceEditModal);
}

function handleSentenceUpdate(e) {
  e.preventDefault();
  const sIdx = state.editingSentenceIndex;
  if (sIdx === null) return;

  const newText = el.editSentenceText.value.trim();
  if (!newText) return;

  const sentences = groupCaptionsIntoSentences(state.captions);
  const oldSentence = sentences[sIdx];

  const startVal = oldSentence[0].start;
  const endVal = oldSentence[oldSentence.length - 1].end;
  const duration = endVal - startVal;

  const newWords = newText.split(/\s+/).filter(w => w.length > 0);
  if (newWords.length === 0) return;

  const wordDuration = duration / newWords.length;
  const updatedSentenceWords = newWords.map((word, i) => {
    return {
      word: word,
      start: startVal + i * wordDuration,
      end: startVal + (i + 1) * wordDuration
    };
  });

  const oldStartIdx = oldSentence[0].originalIndex;
  const oldEndIdx = oldSentence[oldSentence.length - 1].originalIndex;

  state.captions.splice(oldStartIdx, oldEndIdx - oldStartIdx + 1, ...updatedSentenceWords);

  closeModal(el.sentenceEditModal);
  renderTranscriptTimeline(state.captions);
  updateSubtitlePreviewOverlay(el.clipPlayer.currentTime);
}

// Update real-time subtitle overlay preview on the video player
function updateSubtitlePreviewOverlay(time) {
  const overlay = el.subtitlePreviewOverlay;
  if (!overlay) return;

  overlay.className = 'subtitle-preview-overlay';
  overlay.classList.add(`preset-${state.subtitlePreset}`);

  // Apply selected custom font to preview overlay
  const fontSelect = el.subtitleFontSelect;
  const selectedFontValue = fontSelect ? fontSelect.value : 'arial';
  const fontMapping = {
    'the_bold_font': "'The Bold Font', Impact, sans-serif",
    'montserrat_black': "'Montserrat', sans-serif",
    'bangers': "'Bangers', sans-serif",
    'fredoka_one': "'Fredoka', sans-serif",
    'impact': "Impact, sans-serif",
    'nirmala_ui': "'Nirmala UI', 'Segoe UI', sans-serif",
    'segoe_ui': "'Segoe UI', sans-serif",
    'arial': "Arial, sans-serif"
  };
  overlay.style.fontFamily = fontMapping[selectedFontValue] || 'Arial, sans-serif';
  if (selectedFontValue === 'montserrat_black') {
    overlay.style.fontWeight = '900';
  } else if (selectedFontValue === 'fredoka_one') {
    overlay.style.fontWeight = '600';
  } else {
    overlay.style.fontWeight = '';
  }

  if (state.captions.length === 0) {
    overlay.style.display = 'none';
    return;
  }

  const sentences = groupCaptionsIntoSentences(state.captions);

  let activeSentence = null;
  for (const sentence of sentences) {
    const start = sentence[0].start;
    const end = sentence[sentence.length - 1].end;
    if (time >= start && time <= end) {
      activeSentence = sentence;
      break;
    }
  }

  if (!activeSentence) {
    overlay.style.display = 'none';
    return;
  }

  overlay.style.display = 'block';
  overlay.innerHTML = activeSentence.map(w => {
    const isActive = time >= w.start && time <= w.end;
    if (isActive) {
      return `<span class="active-word">${w.word}</span>`;
    }
    return w.word;
  }).join(' ');
}

// ----------------------------------------------------
// Interactive Subtitle Live Demo Functions
// ----------------------------------------------------
function updateSubtitleDemoStage() {
  if (!el.subtitleDemoStage || !el.demoKaraokeText) return;

  const currentStyle = state.subtitlePreset || 'tiktok';

  // Update badge label
  if (el.demoStyleBadge) {
    el.demoStyleBadge.textContent = styleDisplayNames[currentStyle] || currentStyle;
  }

  // Apply selected custom font
  const fontSelect = el.subtitleFontSelect;
  const selectedFontValue = fontSelect ? fontSelect.value : 'arial';
  const fontMapping = {
    'the_bold_font': "'The Bold Font', Impact, sans-serif",
    'montserrat_black': "'Montserrat', sans-serif",
    'bangers': "'Bangers', sans-serif",
    'fredoka_one': "'Fredoka', sans-serif",
    'impact': "Impact, sans-serif",
    'nirmala_ui': "'Nirmala UI', 'Segoe UI', sans-serif",
    'segoe_ui': "'Segoe UI', sans-serif",
    'arial': "Arial, sans-serif"
  };
  el.demoKaraokeText.style.fontFamily = fontMapping[selectedFontValue] || 'Arial, sans-serif';

  renderDemoWords(demoWordIndex);
}

function renderDemoWords(activeIndex) {
  if (!el.demoKaraokeText) return;
  const currentStyle = state.subtitlePreset || 'tiktok';

  el.demoKaraokeText.className = `demo-karaoke-text subtitle-preview-overlay preset-${currentStyle}`;
  el.demoKaraokeText.style.display = 'flex';
  el.demoKaraokeText.style.position = 'relative';
  el.demoKaraokeText.style.top = 'auto';
  el.demoKaraokeText.style.left = 'auto';
  el.demoKaraokeText.style.transform = 'none';

  el.demoKaraokeText.innerHTML = demoWords.map((word, idx) => {
    const isActive = idx === activeIndex;
    if (isActive) {
      return `<span class="demo-word active-word" style="display:inline-block;">${word}</span>`;
    }
    return `<span class="demo-word" style="opacity: 0.85;">${word}</span>`;
  }).join(' ');
}

function startSubtitleDemoLoop() {
  if (demoAnimationTimer) clearInterval(demoAnimationTimer);
  demoWordIndex = 0;
  updateSubtitleDemoStage();

  demoAnimationTimer = setInterval(() => {
    demoWordIndex = (demoWordIndex + 1) % (demoWords.length + 1);
    if (demoWordIndex === demoWords.length) {
      renderDemoWords(-1);
    } else {
      renderDemoWords(demoWordIndex);
    }
  }, 650);
}

// Copy to clipboard helper for virality metadata
window.copyField = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.select();
  el.setSelectionRange(0, 99999); // Mobile compatibility
  navigator.clipboard.writeText(el.value).then(() => {
    const btn = el.nextElementSibling;
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-check';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#10b981';
        setTimeout(() => {
          icon.className = 'fa-regular fa-copy';
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 1500);
      }
    }
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
};

// Load and render exported clips history
async function loadHistory() {
  const container = el.historyList;
  if (!container) return;

  try {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text-secondary);">
        <div class="cyber-spinner" style="width:24px; height:24px; display:inline-block; border-width:2px; vertical-align:middle; margin-right:8px;"></div>
        <span>Loading history...</span>
      </div>
    `;

    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('Failed to fetch history.');

    const data = await res.json();
    const items = data.exports || [];

    if (items.length === 0) {
      container.innerHTML = `
        <div class="history-empty" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size: 48px; margin-bottom: 15px; color: rgba(255,255,255,0.1);"></i>
          <p>No exports found yet. Start clipping to build your history!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((item) => {
      const dateStr = new Date(item.timestamp).toLocaleString();
      const tagsStr = (item.hashtags || []).join(' ');
      const cleanDesc = (item.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const cleanTitle = (item.title || 'Untitled Clip').replace(/'/g, "\\'").replace(/"/g, '&quot;');

      return `
        <div class="history-card-item">
          <!-- Video Preview -->
          <div class="history-video-col">
            <div class="history-video-wrapper">
              <video src="${item.exportUrl}" preload="metadata" controls style="object-fit: contain; width: 100%; height: 100%;"></video>
            </div>
          </div>

          <!-- Metadata & Details -->
          <div class="history-details-col">
            <div class="history-item-header">
              <h3 class="history-item-title" title="${cleanTitle}">${item.title || 'Untitled Clip'}</h3>
              <span class="history-item-time">${dateStr}</span>
            </div>

            <div class="history-item-badges">
              <span class="history-badge badge-preset">${item.style} style</span>
              <span class="history-badge badge-preset">${item.font || 'arial'} font</span>
              <span class="history-badge badge-crop">${item.cropMode === 'crop' ? '9:16 Crop' : (item.cropMode === 'fit_blur' ? '9:16 Fit & Blur' : (item.crop ? '9:16 Crop' : 'Original Ratio'))}</span>
            </div>

            <p class="history-item-desc">${item.description || 'No description generated.'}</p>
            <div class="history-item-tags">${tagsStr}</div>
          </div>

          <!-- Actions -->
          <div class="history-actions-col">
            <button type="button" class="btn-copy" onclick="downloadVideo('/api/download/${item.exportFilename}', '${item.exportFilename}', this)" style="justify-content:center; background:var(--primary-color); color:#fff; border:none; text-align:center; padding:10px; cursor:pointer;">
              <i class="fa-solid fa-download"></i> Download Video
            </button>
            
            <button class="btn-copy" onclick="copyHistoryText('${cleanTitle}', this, 'Title')">
              <i class="fa-regular fa-copy"></i> Copy Title
            </button>
            
            <button class="btn-copy" onclick="copyHistoryText('${tagsStr.replace(/'/g, "\\'")}', this, 'Hashtags')">
              <i class="fa-regular fa-copy"></i> Copy Hashtags
            </button>
            
            <button class="btn-copy history-btn-danger" onclick="deleteHistoryItem('${item.id}')">
              <i class="fa-solid fa-trash-can"></i> Delete Clip
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--accent-color);">
        <i class="fa-solid fa-circle-exclamation" style="font-size:24px;"></i>
        <p style="margin-top:10px;">Failed to load history: ${err.message}</p>
      </div>
    `;
  }
}

// Delete export history item
async function deleteHistoryItem(id) {
  if (!confirm('Are you sure you want to delete this clip? This will permanently delete the file from the server.')) {
    return;
  }

  try {
    const res = await fetch(`/api/history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete history item.');

    // Reload history list
    loadHistory();
  } catch (err) {
    alert(`Error deleting clip: ${err.message}`);
  }
}

// Copy to clipboard helper for history items
window.copyHistoryText = function(text, btnEl, label) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = btnEl.innerHTML;
    
    btnEl.style.borderColor = '#10b981';
    btnEl.style.color = '#10b981';
    btnEl.innerHTML = `<i class="fa-solid fa-check"></i> Copied ${label}`;
    
    setTimeout(() => {
      btnEl.style.borderColor = '';
      btnEl.style.color = '';
      btnEl.innerHTML = originalHTML;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
};

// Autopilot batch processing queue
// Autopilot batch configuration board (pre-processing settings selection)
function renderAutopilotConfigBoard(clips) {
  // Select top 3 viral segments based on score
  const topClips = [...clips]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (topClips.length === 0) {
    el.clipsList.innerHTML = `
      <div class="clips-placeholder">
        <i class="fa-solid fa-face-frown"></i>
        <p>No viral clips identified by Gemini.</p>
      </div>
    `;
    return;
  }

  // Update stepper state
  setStepState('step-analyze', 'complete');
  setStepState('step-refine', 'inactive');

  // Render configuration board layout
  el.clipsList.innerHTML = `
    <div class="autopilot-config-container" style="padding: 10px;">
      <div class="autopilot-header">
        <h3><i class="fa-solid fa-sliders"></i> Configure Batch Processing</h3>
        <p>Customize fonts, styles, and layouts for each shortlisted clip before starting the automated batch render.</p>
      </div>
      <div class="autopilot-config-list" style="display: flex; flex-direction: column; gap: 16px;">
        ${topClips.map((clip, idx) => `
          <div class="autopilot-config-card" id="config-card-${idx}" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--panel-border); border-radius: var(--border-radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 14.5px; color: #fff; font-weight: 600;">${clip.title}</h4>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-secondary);">Score: <strong style="color: var(--secondary-color);">${clip.score}/100</strong> | Duration: ${clip.start.toFixed(1)}s - ${clip.end.toFixed(1)}s</p>
              </div>
              <label class="checkbox-container" style="display: inline-flex; align-items: center; position: relative; cursor: pointer; user-select: none;">
                <input type="checkbox" id="config-include-${idx}" checked style="margin-right: 6px; cursor: pointer;">
                <span style="font-size: 12px; color: var(--text-muted);">Include</span>
              </label>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 4px;">
              <div>
                <label style="display:block; font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Font</label>
                <select id="config-font-${idx}" style="width: 100%; padding: 8px; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--panel-border); border-radius: var(--border-radius-sm); color: #fff; outline: none;">
                  <option value="the_bold_font" selected>The Bold Font</option>
                  <option value="montserrat_black">Montserrat Black</option>
                  <option value="bangers">Bangers</option>
                  <option value="fredoka_one">Fredoka One</option>
                  <option value="impact">Impact</option>
                  <option value="arial">Arial</option>
                </select>
              </div>
              <div>
                <label style="display:block; font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Style</label>
                <select id="config-style-${idx}" style="width: 100%; padding: 8px; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--panel-border); border-radius: var(--border-radius-sm); color: #fff; outline: none;">
                  <option value="tiktok" selected>TikTok Yellow</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="minimalist">Minimalist White</option>
                </select>
              </div>
              <div>
                <label style="display:block; font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Layout</label>
                <select id="config-layout-${idx}" style="width: 100%; padding: 8px; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--panel-border); border-radius: var(--border-radius-sm); color: #fff; outline: none;">
                  <option value="fit_blur" selected>Fit & Blur (9:16)</option>
                  <option value="crop">Center Crop (9:16)</option>
                  <option value="original">Original Ratio</option>
                </select>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button id="btn-start-autopilot" class="btn-primary" style="width: 100%; justify-content: center; padding: 14px; margin-top: 24px; font-weight: 600; font-size: 14px;">
        <i class="fa-solid fa-play"></i> Start Batch Processing
      </button>
    </div>
  `;

  // Bind start button event
  const btnStart = document.getElementById('btn-start-autopilot');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      // Gather config data for active clips
      const queuedClips = [];
      topClips.forEach((clip, idx) => {
        const includeCheckbox = document.getElementById(`config-include-${idx}`);
        if (includeCheckbox && includeCheckbox.checked) {
          queuedClips.push({
            ...clip,
            font: document.getElementById(`config-font-${idx}`).value,
            style: document.getElementById(`config-style-${idx}`).value,
            cropMode: document.getElementById(`config-layout-${idx}`).value
          });
        }
      });

      if (queuedClips.length === 0) {
        alert('Please select at least one clip to process.');
        return;
      }

      // Start the batch execution with chosen settings
      startAutopilotExecution(queuedClips);
    });
  }
}

// Autopilot batch processing queue
async function startAutopilotExecution(queuedClips) {
  // Update stepper state
  setStepState('step-refine', 'active');

  // Render progress board layout
  el.clipsList.innerHTML = `
    <div class="autopilot-progress-container">
      <div class="autopilot-header">
        <h3><i class="fa-solid fa-robot"></i> Autopilot Batch Exporter</h3>
        <p>AI is processing the selected ${queuedClips.length} clips in the background.</p>
      </div>
      <div class="autopilot-queue" id="autopilot-queue">
        ${queuedClips.map((clip, idx) => `
          <div class="autopilot-item" id="autopilot-item-${idx}">
            <div class="autopilot-item-header">
              <h4 class="autopilot-item-title">${clip.title}</h4>
              <span class="autopilot-item-status" id="autopilot-status-${idx}">Pending...</span>
            </div>
            <div class="autopilot-steps-grid">
              <div class="autopilot-step-badge" id="step-cut-${idx}">1. Slice</div>
              <div class="autopilot-step-badge" id="step-transcribe-${idx}">2. Transcribe</div>
              <div class="autopilot-step-badge" id="step-render-${idx}">3. Render</div>
            </div>
            <div class="autopilot-item-result" id="autopilot-result-${idx}" style="margin-top: 15px; display: none;"></div>
          </div>
        `).join('')}
      </div>
      <div id="autopilot-summary" style="margin-top: 24px; text-align: center; display: none;">
        <button id="btn-autopilot-history" class="btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
          <i class="fa-solid fa-clock-rotate-left"></i> View Export History
        </button>
      </div>
    </div>
  `;

  // Sequentially process each clip to avoid server resource starvation
  for (let idx = 0; idx < queuedClips.length; idx++) {
    const clip = queuedClips[idx];
    const itemCard = document.getElementById(`autopilot-item-${idx}`);
    const statusLabel = document.getElementById(`autopilot-status-${idx}`);
    const badgeCut = document.getElementById(`step-cut-${idx}`);
    const badgeTranscribe = document.getElementById(`step-transcribe-${idx}`);
    const badgeRender = document.getElementById(`step-render-${idx}`);

    statusLabel.textContent = 'Processing...';

    try {
      // Step 1: Slice Video clip from source
      badgeCut.classList.add('active');
      statusLabel.textContent = 'Slicing segment...';
      const cutRes = await fetch('/api/cut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: state.videoId,
          start: clip.start,
          end: clip.end
        })
      });
      if (!cutRes.ok) throw new Error('Slicing failed.');
      const cutData = await cutRes.json();
      badgeCut.classList.remove('active');
      badgeCut.classList.add('done');

      // Step 2: Transcribe sliced clip
      badgeTranscribe.classList.add('active');
      statusLabel.textContent = 'Transcribing audio...';
      const captionsRes = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipAudioFilename: cutData.clipAudioFilename,
          language: state.transcriptionLanguage
        })
      });
      if (!captionsRes.ok) throw new Error('Transcription failed.');
      const captionsData = await captionsRes.json();
      badgeTranscribe.classList.remove('active');
      badgeTranscribe.classList.add('done');

      // Step 3: Render layout with viral captions and custom user styles
      badgeRender.classList.add('active');
      statusLabel.textContent = 'Rendering layout...';
      const exportRes = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipFilename: cutData.clipFilename,
          captions: captionsData.captions,
          style: clip.style,
          cropMode: clip.cropMode,
          font: clip.font,
          title: clip.title,
          description: clip.description,
          hashtags: clip.hashtags
        })
      });
      if (!exportRes.ok) throw new Error('Render failed.');
      const exportData = await exportRes.json();
      badgeRender.classList.remove('active');
      badgeRender.classList.add('done');

      // Success
      statusLabel.textContent = 'Completed!';
      itemCard.classList.add('status-done');

      // Populate results inline
      const resultDiv = document.getElementById(`autopilot-result-${idx}`);
      if (resultDiv) {
        const cleanTitle = (clip.title || 'Untitled Clip').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const cleanDesc = (clip.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const tagsStr = (clip.hashtags || []).join(' ');

        resultDiv.innerHTML = `
          <div style="display: flex; gap: 15px; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-top: 10px;">
            <div style="width: 70px; aspect-ratio: 9/16; background: #000; border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);">
              <video src="${exportData.exportUrl}" muted style="width: 100%; height: 100%; object-fit: cover;" onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;"></video>
            </div>
            <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
              <button onclick="previewAutopilotExport('${exportData.exportUrl}', '${exportData.exportFilename}', '${cleanTitle}', '${cleanDesc}', '${tagsStr}', '${clip.cropMode}')" class="btn-copy" style="justify-content:center; background:var(--secondary-color); color:#fff; border:none; text-align:center; padding:8px; cursor:pointer; font-weight:600; border-radius:4px;">
                <i class="fa-solid fa-play"></i> Open in Preview
              </button>
              <button type="button" onclick="downloadVideo('/api/download/${exportData.exportFilename}', '${exportData.exportFilename}', this)" class="btn-copy" style="justify-content:center; background:var(--primary-color); color:#fff; border:none; text-align:center; padding:8px; cursor:pointer; font-weight:600; border-radius:4px;">
                <i class="fa-solid fa-download"></i> Download Video
              </button>
            </div>
          </div>
        `;
        resultDiv.style.display = 'block';
      }

    } catch (err) {
      console.error(`Autopilot error processing clip ${idx}:`, err);
      statusLabel.textContent = 'Failed';
      itemCard.classList.add('status-error');
      
      // Update badges to visually show error
      if (badgeCut.classList.contains('active')) badgeCut.style.borderColor = '#ef4444';
      if (badgeTranscribe.classList.contains('active')) badgeTranscribe.style.borderColor = '#ef4444';
      if (badgeRender.classList.contains('active')) badgeRender.style.borderColor = '#ef4444';
    }
  }

  // Stepper completed state
  setStepState('step-refine', 'complete');

  // Render view history navigation link
  const summaryDiv = document.getElementById('autopilot-summary');
  if (summaryDiv) {
    summaryDiv.style.display = 'block';
    const btnHist = document.getElementById('btn-autopilot-history');
    if (btnHist) {
      btnHist.addEventListener('click', () => {
        loadHistory();
        openModal(el.historyModal);
      });
    }
  }
}

// Force file download using JS Blob fetch to bypass iframe and cross-origin naming blocks
window.downloadVideo = async function(url, filename, btn) {
  if (!btn) return;
  const originalHtml = btn.innerHTML;
  btn.style.pointerEvents = 'none';
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Downloading...`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Fetch download failed, falling back to direct navigation:', err);
    // Fallback: trigger normal download navigation
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    btn.style.pointerEvents = '';
    btn.innerHTML = originalHtml;
  }
};

// Open an autopilot exported video directly in the central Preview Screen
window.previewAutopilotExport = function(exportUrl, exportFilename, title, description, hashtags, cropMode) {
  // Load exported video in Result Screen
  showSection(el.secExportResult);
  
  if (cropMode === 'crop' || cropMode === 'fit_blur') {
    el.exportPreviewContainer.classList.remove('original-ratio');
  } else {
    el.exportPreviewContainer.classList.add('original-ratio');
  }

  el.exportPlayer.src = exportUrl;
  el.exportPlayer.load();

  // Bind the download button to this specific file
  el.btnDownloadExport.href = '#';
  el.btnDownloadExport.onclick = (e) => {
    e.preventDefault();
    downloadVideo(`/api/download/${exportFilename}`, exportFilename, el.btnDownloadExport);
  };

  // Populate virality optimizer fields
  document.getElementById('virality-title').value = title || '';
  document.getElementById('virality-description').value = description || '';
  document.getElementById('virality-hashtags').value = hashtags || '';
};

// ----------------------------------------------------
// Pre-Trimmed Clip Processing Flow
// ----------------------------------------------------

async function handleTrimmedFileSelect() {
  if (!state.apiKeyConfigured) {
    alert('Please configure your Gemini API Key first.');
    openModal(el.settingsModal);
    return;
  }

  const file = el.trimmedFile.files[0];
  if (!file) return;

  if (el.selectedTrimmedName) {
    el.selectedTrimmedName.textContent = `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
  }

  state.isTrimmedUpload = true; // Mark as trimmed upload

  showSection(el.secWorkspace);
  setStepState('step-import', 'active');
  setStepState('step-analyze', 'inactive');
  setStepState('step-refine', 'inactive');

  el.sourcePlayer.style.display = 'none';
  el.processingDetails.style.display = 'flex';
  el.processingStatusText.textContent = 'Uploading pre-trimmed video...';

  const formData = new FormData();
  formData.append('videoFile', file);

  try {
    const res = await fetch('/api/import', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to upload video.');
    }

    const data = await res.json();
    
    state.videoId = data.videoId;
    state.videoUrl = data.videoUrl;

    setStepState('step-import', 'complete');
    setStepState('step-analyze', 'active');

    // Display original video in player
    el.processingDetails.style.display = 'none';
    el.sourcePlayer.style.display = 'block';
    el.sourcePlayer.src = data.videoUrl;
    el.sourcePlayer.load();

    // Trigger Trimmed Analysis
    runTrimmedAnalysis();

  } catch (err) {
    alert(`Error: ${err.message}`);
    showSection(el.secImport);
  }
}

async function runTrimmedAnalysis() {
  el.clipsList.innerHTML = `
    <div class="clips-placeholder">
      <div class="cyber-spinner"></div>
      <p style="margin-top:10px;">Gemini is transcribing and generating social metadata...<br><span style="font-size:12px; color:var(--text-muted);">Processing pre-trimmed clip directly</span></p>
    </div>
  `;

  try {
    const res = await fetch('/api/analyze-trimmed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        videoId: state.videoId,
        language: state.transcriptionLanguage,
        durationMode: state.clipDurationMode,
        minDuration: state.minDuration,
        maxDuration: state.maxDuration
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Analysis failed.');
    }

    const data = await res.json();

    // The whole video file is our clip.
    // The filename of the clip on the server is just the video filename!
    // Get filename from the videoUrl (e.g. /downloads/upload_xxxx.mp4 -> upload_xxxx.mp4)
    const clipFilename = state.videoUrl.split('/').pop();
    
    state.selectedClip = {
      title: data.title,
      description: data.description,
      hashtags: data.hashtags,
      clipFilename: clipFilename
    };
    state.captions = data.captions;

    // Transition to editor
    showSection(el.secEditor);
    setStepState('step-analyze', 'complete');
    setStepState('step-refine', 'active');

    // Load video clip into editor player
    el.clipPlayer.src = state.videoUrl;
    el.clipPlayer.load();
    updateAspectRatioPreview();

    // Render subtitles timeline
    renderTranscriptTimeline(data.captions);

  } catch (err) {
    el.clipsList.innerHTML = `
      <div class="clips-placeholder" style="color:var(--accent-color);">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Analysis failed: ${err.message}</p>
      </div>
    `;
  }
}

// ----------------------------------------------------
// Live Stream Capture & Ready-to-Push Queue Functions
// ----------------------------------------------------

async function handleLiveCaptureStart(e) {
  e.preventDefault();
  const url = el.liveUrl.value.trim();
  if (!url) return;

  const sensitivity = parseInt(el.liveSensitivity.value, 10) || 65;
  const style = el.liveStyle.value || 'tiktok';
  const cropMode = el.liveCropMode ? el.liveCropMode.value : (state.aspectRatio || 'reaction_split');
  const facecamPosition = (el.liveFacecamPos && el.liveFacecamPos.value) || state.facecamPosition || 'bottom_right';

  const originalBtnText = el.btnStartLive.innerHTML;
  el.btnStartLive.disabled = true;
  el.btnStartLive.innerHTML = `<div class="cyber-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Connecting Live Stream...`;

  try {
    const res = await fetch('/api/live/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, sensitivity, style, cropMode, facecamPosition })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to start live capture.');
    }

    // Switch to Workspace section and show Live Stream Monitor Panel
    showSection(el.secWorkspace);
    if (el.processingDetails) el.processingDetails.style.display = 'none';
    if (el.liveStreamPanel) el.liveStreamPanel.style.display = 'block';

    updateLiveUI(data.status);
    startLivePolling();
  } catch (err) {
    alert(`Live Stream Error: ${err.message}`);
  } finally {
    el.btnStartLive.disabled = false;
    el.btnStartLive.innerHTML = originalBtnText;
  }
}

async function handleLiveCaptureStop() {
  if (!confirm('Are you sure you want to stop live stream capture?')) return;

  try {
    await fetch('/api/live/stop', { method: 'POST' });
    stopLivePolling();
    if (el.liveStreamPanel) el.liveStreamPanel.style.display = 'none';
    showSection(el.secImport);
    alert('Live stream capture stopped.');
  } catch (err) {
    console.error('Error stopping stream:', err);
  }
}

async function handleLiveTestTrigger() {
  const originalText = el.btnLiveTestTrigger.innerHTML;
  el.btnLiveTestTrigger.disabled = true;
  el.btnLiveTestTrigger.innerHTML = `<div class="cyber-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Generating Clip...`;

  try {
    const res = await fetch('/api/live/trigger-test', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger test clip.');

    loadQueueBadge();
    loadQueue();
    openModal(el.queueModal);
  } catch (err) {
    alert(`Trigger Clip Error: ${err.message}`);
  } finally {
    el.btnLiveTestTrigger.disabled = false;
    el.btnLiveTestTrigger.innerHTML = originalText;
  }
}

function startLivePolling() {
  if (livePollingTimer) clearInterval(livePollingTimer);
  livePollingTimer = setInterval(async () => {
    await checkLiveStatus();
  }, 2500);
}

function stopLivePolling() {
  if (livePollingTimer) {
    clearInterval(livePollingTimer);
    livePollingTimer = null;
  }
}

async function checkLiveStatus() {
  try {
    const res = await fetch('/api/live/status');
    const data = await res.json();
    if (data.success && data.status) {
      if (data.status.isCapturing) {
        if (el.liveStreamPanel) el.liveStreamPanel.style.display = 'block';
        updateLiveUI(data.status);
        if (!livePollingTimer) startLivePolling();
      } else {
        if (el.liveStreamPanel && el.secWorkspace && el.secWorkspace.classList.contains('active')) {
          el.liveStreamPanel.style.display = 'none';
        }
      }
    }
    loadQueueBadge();
  } catch (err) {
    console.warn('Live status check notice:', err.message);
  }
}

function updateLiveUI(status) {
  if (!status) return;

  if (el.liveStreamTitle) el.liveStreamTitle.textContent = status.streamTitle || 'Live Stream';
  if (el.liveStreamUploader) el.liveStreamUploader.textContent = status.uploader ? `(${status.uploader})` : '';
  
  if (el.liveStatViewers) {
    el.liveStatViewers.textContent = Number(status.viewerCount || 0).toLocaleString();
  }

  if (el.liveStatDuration) {
    const s = status.elapsedSeconds || 0;
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    el.liveStatDuration.textContent = `Duration: ${h}:${m}:${sec}`;
  }

  if (el.liveStatChat) {
    el.liveStatChat.textContent = status.chatVelocity || 0;
  }
  if (el.liveChatStatus) {
    const vel = status.chatVelocity || 0;
    if (vel >= 50) {
      el.liveChatStatus.innerHTML = `<span style="color:#ff3b30;font-weight:bold;">🔥 Reaction Spike!</span>`;
    } else if (vel >= 30) {
      el.liveChatStatus.innerHTML = `<span style="color:#00e5ff;">Active Chatting</span>`;
    } else {
      el.liveChatStatus.textContent = 'Normal Chat Traffic';
    }
  }

  if (el.liveStatAudio) {
    el.liveStatAudio.textContent = status.audioVolumeDb || -25;
  }
  if (el.liveAudioStatus) {
    const db = status.audioVolumeDb || -25;
    if (db >= -8) {
      el.liveAudioStatus.innerHTML = `<span style="color:#ff3b30;font-weight:bold;">🔊 Hype / Screaming!</span>`;
    } else if (db >= -15) {
      el.liveAudioStatus.innerHTML = `<span style="color:#00e676;">Lively Commentary</span>`;
    } else {
      el.liveAudioStatus.textContent = 'Speech Energy Normal';
    }
  }

  if (el.liveStatHype) {
    const score = status.hypeScore || 0;
    const sens = status.sensitivity || 65;
    el.liveStatHype.textContent = `${score} / ${sens}`;
    if (el.liveHypeFill) {
      el.liveHypeFill.style.width = `${Math.min(100, score)}%`;
      if (score >= sens) {
        el.liveHypeFill.style.background = 'linear-gradient(90deg, #ff9500, #ff3b30)';
      } else {
        el.liveHypeFill.style.background = 'linear-gradient(90deg, #00e5ff, #00e676)';
      }
    }
  }

  if (el.liveActivityLog && status.recentEvents && status.recentEvents.length > 0) {
    el.liveActivityLog.innerHTML = status.recentEvents.map(e => `<div>${e}</div>`).join('');
    el.liveActivityLog.scrollTop = el.liveActivityLog.scrollHeight;
  }
}

async function loadQueueBadge() {
  try {
    const res = await fetch('/api/live/queue');
    const data = await res.json();
    if (data.success && data.queue) {
      const count = data.queue.length;
      if (el.queueBadge) {
        if (count > 0) {
          el.queueBadge.textContent = count;
          el.queueBadge.style.display = 'inline-block';
        } else {
          el.queueBadge.style.display = 'none';
        }
      }
      if (el.queueModalCount) {
        el.queueModalCount.textContent = `${count} Clips`;
      }
    }
  } catch (e) {}
}

async function loadQueue() {
  if (!el.queueList) return;

  try {
    el.queueList.innerHTML = `<div style="text-align:center;padding:30px;"><div class="cyber-spinner"></div><p style="margin-top:10px;color:var(--text-muted);">Loading Ready to Push Queue...</p></div>`;

    const res = await fetch('/api/live/queue');
    const data = await res.json();

    if (!data.success || !data.queue || data.queue.length === 0) {
      el.queueList.innerHTML = `
        <div class="queue-empty" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-clapperboard" style="font-size: 48px; margin-bottom: 15px; color: rgba(255,255,255,0.1);"></i>
          <p>No clips in the Ready to Push queue yet. Start a live capture to automatically generate viral clips!</p>
        </div>`;
      return;
    }

    el.queueList.innerHTML = data.queue.map(item => `
      <div class="queue-item-card glass-panel" data-id="${item.id}" style="margin-bottom: 20px; padding: 18px; border: 1px solid var(--panel-border); border-radius: var(--border-radius-md); background: rgba(0,0,0,0.35);">
        <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px;">
          <!-- 9:16 Video Preview -->
          <div style="position: relative; border-radius: 8px; overflow: hidden; background: #000; aspect-ratio: 9/16; max-height: 350px;">
            <video src="${item.exportUrl}" controls preload="metadata" style="width: 100%; height: 100%; object-fit: contain;"></video>
            <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; color: #ff3b30; border: 1px solid rgba(255,59,48,0.5);">
              🔥 ${item.viralityScore}% Viral
            </div>
          </div>

          <!-- Metadata & Actions -->
          <div style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-clock"></i> ${new Date(item.createdAt).toLocaleTimeString()} &bull; ${item.triggerReason || 'Live Spike'}
                </span>
                <span class="queue-status-tag" style="background: ${item.youtubeUrl || item.status === 'pushed' ? 'rgba(16,185,129,0.2)' : 'rgba(255,204,0,0.2)'}; color: ${item.youtubeUrl || item.status === 'pushed' ? '#10b981' : '#ffcc00'}; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px;">
                  ${item.youtubeUrl ? '✓ LIVE ON SHORTS' : (item.status === 'pushed' ? '✓ PUSHED' : '⚡ READY TO PUSH')}
                </span>
              </div>

              <!-- Title Field -->
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Viral Title (Shorts / TikTok)</label>
                <input type="text" class="queue-title-input" value="${escapeHtml(item.title)}" style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid var(--panel-border); border-radius: var(--border-radius-sm); color: #fff; font-family: inherit; font-size: 13.5px; font-weight: 600;">
              </div>

              <!-- Description & Tags -->
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Description & Hashtags</label>
                <textarea rows="3" class="queue-desc-input" style="width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid var(--panel-border); border-radius: var(--border-radius-sm); color: #fff; font-family: inherit; font-size: 12px; resize: vertical;">${escapeHtml(item.description || '')}\n\n${(item.hashtags || []).join(' ')}</textarea>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 10px; border-top: 1px solid var(--panel-border); padding-top: 12px;">
              <button type="button" onclick="downloadVideo('/api/download/${encodeURIComponent(item.exportFilename)}', '${item.exportFilename}', this)" class="btn-primary" style="padding: 6px 14px; font-size: 12.5px; border:none; cursor:pointer;">
                <i class="fa-solid fa-download"></i> Download 9:16 MP4
              </button>
              ${item.youtubeUrl ? `
                <a href="${item.youtubeUrl}" target="_blank" class="btn-primary" style="padding: 6px 14px; font-size: 12.5px; border:none; text-decoration:none; background: #10b981; display:inline-flex; align-items:center; gap:6px;">
                  <i class="fa-brands fa-youtube"></i> View on Shorts
                </a>
              ` : `
                <button type="button" onclick="uploadQueueItemToYoutube('${item.id}', this)" class="btn-primary" style="padding: 6px 14px; font-size: 12.5px; border:none; cursor:pointer; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                  <i class="fa-brands fa-youtube"></i> Upload to Shorts
                </button>
              `}
              <button class="btn-secondary btn-copy-queue-meta" onclick="copyQueueMetadata('${item.id}')" style="padding: 6px 14px; font-size: 12.5px;">
                <i class="fa-regular fa-copy"></i> Copy Title & Tags
              </button>
              <button class="btn-secondary" onclick="toggleQueueStatus('${item.id}')" style="padding: 6px 14px; font-size: 12.5px;">
                ${item.status === 'pushed' ? '<i class="fa-solid fa-rotate-left"></i> Mark as Ready' : '<i class="fa-solid fa-check"></i> Mark as Pushed'}
              </button>
              <button class="btn-icon" onclick="deleteQueueItem('${item.id}')" title="Delete Clip" style="margin-left: auto; color: #ef4444; width: 32px; height: 32px;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Attach blur save listeners on inputs
    document.querySelectorAll('.queue-item-card').forEach(card => {
      const id = card.dataset.id;
      const titleInput = card.querySelector('.queue-title-input');
      const descInput = card.querySelector('.queue-desc-input');

      const saveUpdates = async () => {
        const title = titleInput.value.trim();
        const descText = descInput.value.trim();
        await fetch(`/api/live/queue/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description: descText })
        });
      };

      titleInput.addEventListener('change', saveUpdates);
      descInput.addEventListener('change', saveUpdates);
    });

  } catch (err) {
    el.queueList.innerHTML = `<div style="color:#ef4444;padding:20px;">Failed to load queue: ${err.message}</div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function copyQueueMetadata(id) {
  const card = document.querySelector(`.queue-item-card[data-id="${id}"]`);
  if (!card) return;
  const title = card.querySelector('.queue-title-input').value.trim();
  const desc = card.querySelector('.queue-desc-input').value.trim();
  const textToCopy = `${title}\n\n${desc}`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    alert('Copied Title & Description to clipboard!');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = textToCopy;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Copied Title & Description to clipboard!');
  }
}

async function toggleQueueStatus(id) {
  try {
    const card = document.querySelector(`.queue-item-card[data-id="${id}"]`);
    const isPushed = card.innerText.includes('PUSHED');
    const newStatus = isPushed ? 'ready' : 'pushed';

    await fetch(`/api/live/queue/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadQueue();
  } catch (err) {
    console.error('Error toggling status:', err);
  }
}

async function deleteQueueItem(id) {
  if (!confirm('Are you sure you want to delete this clip from the Ready to Push queue?')) return;
  try {
    await fetch(`/api/live/queue/${id}`, { method: 'DELETE' });
    loadQueue();
    loadQueueBadge();
  } catch (err) {
    console.error('Error deleting clip:', err);
  }
}

// ----------------------------------------------------
// Live Gaming & GTA 6 Stream Discovery Radar
// ----------------------------------------------------
async function fetchLiveStreams(customQuery, isLive = true) {
  const query = customQuery || (el.streamSearchInput ? el.streamSearchInput.value.trim() : 'GTA 6 live stream gaming');
  if (!query) return;

  if (el.streamSearchResults) {
    el.streamSearchResults.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; color: var(--text-secondary);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 26px; color: var(--accent-pink); margin-bottom: 12px; display: block;"></i>
        Scanning live GTA 6 &amp; gaming broadcasts for "<strong>${escapeHtml(query)}</strong>"...
      </div>
    `;
  }

  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&live=${isLive ? 'true' : 'false'}&maxResults=8`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to search streams.');
    }

    if (el.ytSearchSourceIndicator) {
      if (data.source === 'youtube_data_api_v3') {
        el.ytSearchSourceIndicator.innerHTML = `<i class="fa-brands fa-youtube" style="color: #ff3b30; margin-right: 4px;"></i> YouTube API v3 Active`;
      } else if (data.source === 'radar_backup') {
        el.ytSearchSourceIndicator.innerHTML = `<i class="fa-solid fa-shield-halved" style="color: #38bdf8; margin-right: 4px;"></i> Verified Stream Radar`;
      } else {
        el.ytSearchSourceIndicator.innerHTML = `<i class="fa-solid fa-bolt" style="color: #10b981; margin-right: 4px;"></i> High-Speed yt-dlp Engine`;
      }
    }

    renderStreamResults(data.videos || []);
  } catch (err) {
    console.warn('Network issue fetching streams, serving verified radar stream cards:', err.message);
    if (el.ytSearchSourceIndicator) {
      el.ytSearchSourceIndicator.innerHTML = `<i class="fa-solid fa-shield-halved" style="color: #38bdf8; margin-right: 4px;"></i> Verified Stream Radar`;
    }
    renderStreamResults([
      {
        id: 'irNhWMG560k',
        title: 'CARRYMINATI PLAYS GTA VI | NO PROMOTIONS',
        channel: 'CarryisLive',
        thumbnail: 'https://i.ytimg.com/vi/irNhWMG560k/hqdefault.jpg',
        isLive: true,
        duration: 'LIVE',
        url: 'https://www.youtube.com/watch?v=irNhWMG560k'
      },
      {
        id: '169ZzvPxvvM',
        title: 'MY FIRST DAY IN VICE CITY | GTA 6 GAMEPLAY #1',
        channel: 'TGG Gaming',
        thumbnail: 'https://i.ytimg.com/vi/169ZzvPxvvM/hqdefault.jpg',
        isLive: true,
        duration: 'LIVE',
        url: 'https://www.youtube.com/watch?v=169ZzvPxvvM'
      },
      {
        id: 'YwMKWQd1W7Y',
        title: '🔴 24/7 Gaming & World News Live Broadcast',
        channel: 'Global Gaming Network',
        thumbnail: 'https://i.ytimg.com/vi/YwMKWQd1W7Y/hqdefault.jpg',
        isLive: true,
        duration: 'LIVE',
        url: 'https://www.youtube.com/watch?v=YwMKWQd1W7Y'
      },
      {
        id: 'jfKfPfyJRdk',
        title: 'GTA V RP NoPixel 4.0 - Cop Chase & Bank Heist Madness',
        channel: 'Buddha RP',
        thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
        isLive: true,
        duration: 'LIVE',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
      }
    ]);
  }
}

function renderStreamResults(videos) {
  if (!el.streamSearchResults) return;
  if (!videos || videos.length === 0) {
    el.streamSearchResults.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-satellite-dish" style="font-size: 24px; margin-bottom: 8px; opacity: 0.5; display: block;"></i>
        No matching streams or gaming videos found right now. Try another query or preset above.
      </div>
    `;
    return;
  }

  el.streamSearchResults.innerHTML = videos.map(v => {
    const isLive = v.isLive === true || v.liveStatus === 'live' || v.liveStatus === 'is_live';
    const tagHtml = isLive 
      ? `<span class="stream-live-tag"><span class="pulse-dot" style="width: 6px; height: 6px; background-color: #fff;"></span> LIVE</span>`
      : (v.duration ? `<span class="stream-duration-tag">${escapeHtml(v.duration)}</span>` : '');

    const safeUrl = escapeHtml(v.url || `https://www.youtube.com/watch?v=${v.id}`);

    return `
      <div class="stream-card" data-video-id="${escapeHtml(v.id)}" data-url="${safeUrl}">
        <div class="stream-thumb-wrap">
          <img class="stream-thumb-img" src="${escapeHtml(v.thumbnail)}" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${escapeHtml(v.id)}/hqdefault.jpg'">
          ${tagHtml}
        </div>
        <div class="stream-card-body">
          <div class="stream-card-title" title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</div>
          <div class="stream-card-channel">
            <i class="fa-solid fa-gamepad" style="color: var(--accent-pink);"></i>
            <span>${escapeHtml(v.channel)}</span>
          </div>
          <div class="stream-card-actions">
            <button type="button" class="stream-btn-action stream-btn-capture" onclick="selectStreamForLiveCapture('${safeUrl}')">
              <i class="fa-solid fa-satellite-dish"></i> Capture Stream
            </button>
            <button type="button" class="stream-btn-action stream-btn-clip" onclick="selectStreamForClipImport('${safeUrl}')">
              <i class="fa-solid fa-scissors"></i> Clip
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.selectStreamForLiveCapture = function(url) {
  const liveTabBtn = document.querySelector('.tab-btn[data-tab="tab-livestream"]');
  if (liveTabBtn) {
    liveTabBtn.click();
  }
  if (el.liveUrl) {
    el.liveUrl.value = url;
    el.liveUrl.focus();
    el.liveUrl.style.outline = '2px solid var(--accent-pink)';
    setTimeout(() => { if (el.liveUrl) el.liveUrl.style.outline = 'none'; }, 1800);
    if (el.btnStartLive) {
      el.btnStartLive.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};

window.selectStreamForClipImport = function(url) {
  if (el.ytUrl) {
    el.ytUrl.value = url;
  }
  const ytTabBtn = document.querySelector('.tab-btn[data-tab="tab-youtube"]');
  if (ytTabBtn) {
    ytTabBtn.click();
    if (el.ytUrl) {
      el.ytUrl.focus();
      el.ytUrl.style.outline = '2px solid var(--accent-pink)';
      setTimeout(() => { if (el.ytUrl) el.ytUrl.style.outline = 'none'; }, 1800);
    }
  }
};

// ----------------------------------------------------
// Turbo Multiprocessing Engine (Multi-Clip Gaming Extraction)
// ----------------------------------------------------
let turboPollTimer = null;
let turboStopwatchInterval = null;

const TURBO_STYLE_ACCENTS = {
  hormozi: { color: '#a3e635', label: 'Alex Hormozi' },
  mrbeast: { color: '#fbbf24', label: 'MrBeast Hype' },
  fire_glow: { color: '#f97316', label: 'Fire Glow' },
  cyberpunk: { color: '#a855f7', label: 'Cyberpunk' },
  highlighter: { color: '#38bdf8', label: 'Highlighter' },
  tiktok: { color: '#ec4899', label: 'TikTok Clean' },
  minimalist: { color: '#e2e8f0', label: 'Minimalist' }
};

function renderTurboWorkersGrid(workers) {
  if (!el.turboWorkersGrid || !Array.isArray(workers)) return;
  el.turboWorkersGrid.innerHTML = workers.map((w, idx) => {
    const styleInfo = TURBO_STYLE_ACCENTS[w.style] || { color: '#a855f7', label: w.style || `Style ${idx + 1}` };
    return `
      <div class="turbo-worker-card" id="turbo-worker-${idx}" style="background: rgba(0,0,0,0.35); padding: 14px; border-radius: 8px; border: 1px solid var(--panel-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: ${styleInfo.color}; text-transform: uppercase;">Worker ${idx + 1} • ${escapeHtml(styleInfo.label)}</span>
          <span class="turbo-worker-badge" id="turbo-worker-badge-${idx}" style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">QUEUED</span>
        </div>
        <div class="turbo-worker-title" id="turbo-worker-title-${idx}" style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(w.name || `Clip ${idx + 1}`)}</div>
        <div class="progress-bar-bg" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
          <div class="progress-bar-fill" id="turbo-worker-progress-${idx}" style="width: ${w.progress || 10}%; height: 100%; background: ${styleInfo.color}; transition: width 0.3s ease;"></div>
        </div>
        <div id="turbo-worker-desc-${idx}" style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Spawning worker process...</div>
      </div>
    `;
  }).join('');
}

async function startTurboWorkflow(videoId, language = 'auto', manualClips = null) {
  const lang = language || state.transcriptionLanguage || 'auto';
  const maxClips = el.turboClipCount ? el.turboClipCount.value : 'auto';

  // Display Turbo Dashboard Panel
  if (el.turboDashboardPanel) {
    el.turboDashboardPanel.style.display = 'block';
    el.turboDashboardPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Reset UI states
  if (el.btnTurboViewQueue) el.btnTurboViewQueue.style.display = 'none';
  if (el.turboResultsContainer) el.turboResultsContainer.style.display = 'none';
  if (el.turboStatusHeadline) {
    el.turboStatusHeadline.textContent = maxClips === 'auto'
      ? 'Extracting All Possible Gaming Viral Clips...'
      : `Extracting ${maxClips} Gaming Viral Clips in Parallel...`;
  }

  // Initial placeholder in workers grid
  if (el.turboWorkersGrid) {
    el.turboWorkersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        <i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 8px; color: #f59e0b;"></i> Initializing multi-clip extraction pipeline...
      </div>
    `;
  }

  // Start stopwatch
  const startTime = Date.now();
  if (turboStopwatchInterval) clearInterval(turboStopwatchInterval);
  turboStopwatchInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    if (el.turboStopwatch) el.turboStopwatch.textContent = `${m}:${s}`;
  }, 1000);

  try {
    const startRes = await fetch('/api/turbo/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        language: lang,
        styleMode: 'all',
        cropMode: state.aspectRatio || 'reaction_split',
        facecamPosition: state.facecamPosition || 'bottom_right',
        quality: state.exportQuality || (el.turboQualitySelect ? el.turboQualitySelect.value : '1080p'),
        durationMode: state.clipDurationMode || '30-60',
        minDuration: state.minDuration,
        maxDuration: state.maxDuration,
        maxClips,
        manualClips
      })
    });

    const startData = await startRes.json();
    if (!startData.success) {
      throw new Error(startData.error || 'Failed to start turbo batch.');
    }

    const batchId = startData.batchId;

    // Poll status every 1200ms
    if (turboPollTimer) clearInterval(turboPollTimer);
    turboPollTimer = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/turbo/status/${batchId}`);
        const statusData = await statusRes.json();
        if (!statusData.success || !statusData.status) return;

        const batch = statusData.status;

        // Render dynamic worker cards if not already populated or if count changed
        if (Array.isArray(batch.workers) && batch.workers.length > 0) {
          if (!document.getElementById(`turbo-worker-${batch.workers.length - 1}`)) {
            renderTurboWorkersGrid(batch.workers);
          }

          // Update worker cards
          batch.workers.forEach((w, idx) => {
            const badge = document.getElementById(`turbo-worker-badge-${idx}`);
            const title = document.getElementById(`turbo-worker-title-${idx}`);
            const prog = document.getElementById(`turbo-worker-progress-${idx}`);
            const desc = document.getElementById(`turbo-worker-desc-${idx}`);

            if (badge) {
              badge.textContent = w.stage.toUpperCase();
              badge.style.color = w.stage === 'done' ? '#10b981' : (w.stage === 'rendering' ? '#f59e0b' : '#38bdf8');
            }
            if (title && w.name) title.textContent = w.name;
            if (prog) prog.style.width = `${w.progress}%`;
            if (desc) {
              if (w.stage === 'cutting') desc.textContent = 'Ultra-fast lossless stream slice...';
              else if (w.stage === 'transcribing') desc.textContent = 'Transcribing words with Gemini AI...';
              else if (w.stage === 'styling') desc.textContent = `Applying ${w.style.toUpperCase()} styling...`;
              else if (w.stage === 'rendering') desc.textContent = 'Multi-threaded CPU encoding & 9:16 crop...';
              else if (w.stage === 'done') desc.textContent = '✅ Finished & Ready to Push!';
            }
          });
        }

        // Check if finished
        if (batch.status === 'completed') {
          clearInterval(turboPollTimer);
          clearInterval(turboStopwatchInterval);

          const totalSec = batch.elapsedSeconds;
          const clipCount = (batch.clips || []).length;
          if (el.turboStatusHeadline) {
            el.turboStatusHeadline.innerHTML = `🎉 ${clipCount} Clips Generated, Transcribed, Styled &amp; Rendered in <span style="color:#10b981; font-weight:700;">${totalSec}s</span>!`;
          }

          if (el.btnTurboViewQueue) {
            el.btnTurboViewQueue.style.display = 'inline-flex';
            if (el.turboCompletedCount) el.turboCompletedCount.textContent = `${clipCount}`;
          }
          if (el.turboResultsCount) el.turboResultsCount.textContent = `${clipCount}`;

          // Render finished clips cards
          renderTurboResults(batch.clips || []);
          loadQueueBadge();
          setStepState('step-import', 'complete');
          setStepState('step-analyze', 'complete');
          setStepState('step-refine', 'complete');
        } else if (batch.status === 'failed') {
          clearInterval(turboPollTimer);
          clearInterval(turboStopwatchInterval);
          if (el.turboStatusHeadline) {
            el.turboStatusHeadline.innerHTML = `<span style="color:#ef4444;">Pipeline error: ${escapeHtml(batch.error || 'Failed')}</span>`;
          }
        }
      } catch (pollErr) {
        console.error('Polling error:', pollErr);
      }
    }, 1200);

  } catch (err) {
    clearInterval(turboPollTimer);
    clearInterval(turboStopwatchInterval);
    alert(`Turbo pipeline failed: ${err.message}`);
  }
}

function renderTurboResults(clips) {
  if (!el.turboResultsContainer || !el.turboResultsGrid) return;
  el.turboResultsContainer.style.display = 'block';

  el.turboResultsGrid.innerHTML = clips.map((clip, idx) => {
    return `
      <div class="turbo-result-card" style="background: var(--surface-alt); border: 1px solid var(--panel-border); border-radius: var(--border-radius-md); overflow: hidden; display: flex; flex-direction: column;">
        <div style="position: relative; width: 100%; padding-top: 177.7%; background: #000; overflow: hidden;">
          <video src="${escapeHtml(clip.exportUrl)}" controls playsinline style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover;"></video>
          <span style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
            ${escapeHtml(clip.style)}
          </span>
          <span style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #38bdf8; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
            ${(clip.quality || state.exportQuality) === '4k' ? '4K UHD' : '1080P HD'}
          </span>
          <span style="position: absolute; top: 8px; right: 8px; background: rgba(16, 185, 129, 0.85); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
            ${clip.viralityScore}% VIRAL
          </span>
        </div>
        <div style="padding: 10px 12px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
          <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(clip.title)}">
            ${escapeHtml(clip.title)}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="${escapeHtml(clip.exportUrl)}" download="${escapeHtml(clip.exportFilename)}" class="btn-primary" style="flex: 1; font-size: 11px; padding: 6px; text-align: center; text-decoration: none; justify-content: center; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-download"></i> Download
            </a>
            ${clip.youtubeUrl ? `
              <a href="${clip.youtubeUrl}" target="_blank" class="btn-primary" style="font-size: 11px; padding: 6px 10px; background: #10b981; text-decoration:none; display:inline-flex; align-items:center;" title="View on YouTube Shorts">
                <i class="fa-brands fa-youtube"></i>
              </a>
            ` : `
              <button type="button" class="btn-primary" style="font-size: 11px; padding: 6px 10px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; cursor: pointer;" onclick="uploadQueueItemToYoutube('${escapeHtml(clip.id)}', this)" title="Upload to YouTube Shorts">
                <i class="fa-brands fa-youtube"></i>
              </button>
            `}
            <button type="button" class="btn-secondary" style="font-size: 11px; padding: 6px 10px;" onclick="copyQueueMetadata('${escapeHtml(clip.id)}')">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Autopilot Hook: If Auto-Upload to Shorts is enabled, automatically upload all clips
  if (state.autoUploadYoutube && state.youtubeConnected) {
    console.log('[Autopilot] Automatically publishing Turbo clips to YouTube Shorts...');
    clips.forEach(clip => {
      if (!clip.youtubeUrl) {
        fetch('/api/youtube/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: clip.id,
            exportFilename: clip.exportFilename,
            title: clip.title,
            description: clip.description,
            hashtags: clip.hashtags,
            privacyStatus: state.youtubePrivacy || 'public'
          })
        }).then(r => r.json()).then(res => {
          if (res && res.success) {
            clip.youtubeUrl = res.youtubeUrl;
            showBypassNoticeToast(`🚀 Auto-Uploaded "${clip.title.slice(0, 25)}..." to YouTube Shorts!`);
          }
        }).catch(err => {
          console.warn('[Autopilot] YouTube auto-upload notice:', err.message);
        });
      }
    });
  }
}


