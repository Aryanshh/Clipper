// Clipper SPA Application State
const state = {
  apiKeyConfigured: false,
  videoId: null,
  videoUrl: null,
  clips: [],
  selectedClip: null,
  captions: [],
  subtitlePreset: 'tiktok',
  aspectRatio: 'crop',
  editingWordIndex: null,
  editingSentenceIndex: null
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
  keyStatus: document.getElementById('key-status'),

  // Import screen elements
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  formImportYt: document.getElementById('form-import-yt'),
  ytUrl: document.getElementById('yt-url'),
  dropZone: document.getElementById('drop-zone'),
  localFile: document.getElementById('local-file'),
  selectedFileName: document.getElementById('selected-file-name'),

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
  autopilotCheckbox: document.getElementById('autopilot-checkbox')
};

// ----------------------------------------------------
// Init & Settings
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  checkSettings();
  setupEventListeners();
});

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

  // Editor Navigation
  el.btnBackToClips.addEventListener('click', () => {
    el.clipPlayer.pause();
    showSection(el.secWorkspace);
  });

  // Subtitle preset selection
  el.stylePresetCards.forEach(card => {
    card.addEventListener('click', () => {
      el.stylePresetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.subtitlePreset = card.dataset.style;
      renderTranscriptTimeline(state.captions);
      updateSubtitlePreviewOverlay(el.clipPlayer.currentTime);
    });
  });

  // Aspect ratio crop toggle
  el.ratioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.ratioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.aspectRatio = btn.dataset.ratio;
      updateAspectRatioPreview();
    });
  });

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
  if (!apiKey) return;

  try {
    el.keyStatus.textContent = 'Saving settings...';
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, youtubeCookies })
    });
    const data = await res.json();
    if (data.success) {
      state.apiKeyConfigured = true;
      closeModal(el.settingsModal);
      checkSettings();
    } else {
      el.keyStatus.textContent = 'Error saving settings.';
      el.keyStatus.style.color = '#ef4444';
    }
  } catch (err) {
    el.keyStatus.textContent = err.message;
    el.keyStatus.style.color = '#ef4444';
  }
}

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
  el.processingStatusText.innerHTML = `Downloading YouTube video...<br><span style="font-size:12px; color:var(--text-muted);">Running yt-dlp module on server</span>`;

  try {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to download video.');
    }

    const data = await res.json();
    handleImportSuccess(data);

  } catch (err) {
    alert(`Error: ${err.message}`);
    showSection(el.secImport);
  }
}

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
  state.videoId = data.videoId;
  state.videoUrl = data.videoUrl;

  setStepState('step-import', 'complete');
  setStepState('step-analyze', 'active');

  // Display original video in player
  el.processingDetails.style.display = 'none';
  el.sourcePlayer.style.display = 'block';
  el.sourcePlayer.src = data.videoUrl;
  el.sourcePlayer.load();

  // Trigger Gemini Analysis
  runGeminiAnalysis();
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
      body: JSON.stringify({ videoId: state.videoId })
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

    // Load sliced video clip
    el.clipPlayer.src = dataCut.clipUrl;
    el.clipPlayer.load();
    updateAspectRatioPreview();

    // 2. Fetch word-level captions from Gemini
    el.transcriptTimeline.innerHTML = `
      <div class="transcript-placeholder">
        <div class="cyber-spinner"></div>
        <p>Transcribing audio track with word-level accuracy...<br><span style="font-size:12px; color:var(--text-muted);">Powered by Gemini Multimodal API</span></p>
      </div>
    `;

    const resCaptions = await fetch('/api/captions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipAudioFilename: dataCut.clipAudioFilename
      })
    });

    if (!resCaptions.ok) {
      const errData = await resCaptions.json();
      throw new Error(errData.error || 'Transcription failed.');
    }

    const dataCaptions = await resCaptions.json();
    state.captions = dataCaptions.captions;
    renderTranscriptTimeline(dataCaptions.captions);

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
        font: fontSelect ? fontSelect.value : 'arial'
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to render subtitles.');
    }

    const data = await res.json();
    
    // Load exported video in Result Screen
    showSection(el.secExportResult);
    
    if (state.aspectRatio === 'crop' || state.aspectRatio === 'fit_blur') {
      el.exportPreviewContainer.classList.remove('original-ratio');
    } else {
      el.exportPreviewContainer.classList.add('original-ratio');
    }

    el.exportPlayer.src = data.exportUrl;
    el.exportPlayer.load();

    el.btnDownloadExport.href = data.exportUrl;

    // Populate virality optimizer fields
    document.getElementById('virality-title').value = state.selectedClip.title || '';
    document.getElementById('virality-description').value = state.selectedClip.description || '';
    document.getElementById('virality-hashtags').value = (state.selectedClip.hashtags || []).join(' ');

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
  if (state.aspectRatio === 'crop' || state.aspectRatio === 'fit_blur') {
    container.classList.add('crop-9-16-active');
  } else {
    container.classList.remove('crop-9-16-active');
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
              <video src="${item.exportUrl}" preload="metadata" muted loop onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;"></video>
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
            <a href="/api/download/${item.exportFilename}" download="${item.exportFilename}" class="btn-copy" style="text-decoration:none; justify-content:center; background:var(--primary-color); color:#fff; border:none; text-align:center; padding:10px;">
              <i class="fa-solid fa-download"></i> Download Video
            </a>
            
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
          clipAudioFilename: cutData.clipAudioFilename
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
      badgeRender.classList.remove('active');
      badgeRender.classList.add('done');

      // Success
      statusLabel.textContent = 'Completed!';
      itemCard.classList.add('status-done');

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
