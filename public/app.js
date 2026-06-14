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
  subtitlePreviewOverlay: document.getElementById('subtitle-preview-overlay')
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
  if (!apiKey) return;

  try {
    el.keyStatus.textContent = 'Saving key...';
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const data = await res.json();
    if (data.success) {
      state.apiKeyConfigured = true;
      closeModal(el.settingsModal);
      checkSettings();
    } else {
      el.keyStatus.textContent = 'Error saving key.';
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
    renderClips(data.clips);

    setStepState('step-analyze', 'complete');
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
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipFilename: state.selectedClip.clipFilename,
        captions: state.captions,
        style: state.subtitlePreset,
        crop: state.aspectRatio === 'crop'
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to render subtitles.');
    }

    const data = await res.json();
    
    // Load exported video in Result Screen
    showSection(el.secExportResult);
    
    if (state.aspectRatio === 'crop') {
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
  if (state.aspectRatio === 'crop') {
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
