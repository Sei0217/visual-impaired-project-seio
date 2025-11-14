// Real-time Object Detection with Roboflow
(function() {
  'use strict';

  // ========================================
  // ROBOFLOW CONFIGURATION
  // ========================================
  const ROBOFLOW_CONFIG = {
    apiKey: 'MvAPSE6lMWD1bxEBRpJZ',
    modelId: 'trial-sjo4y',
    version: '1',
    confidenceThreshold: 40,
    fps: 4,
    apiBase: 'https://detect.roboflow.com'
  };

  // ========================================
  // COLOR CONFIGURATION
  // ========================================
  const OBJECT_COLORS = {
    'people': '#FF0000',
    'person': '#FF0000',
    'stairs': '#FFA500',
    'stair': '#FFA500',
    'door': '#00FF00',
    'default': '#00FFFF'
  };

  const OBJECT_PRIORITY = {
    'stairs': 3,
    'stair': 3,
    'people': 2,
    'person': 2,
    'door': 1
  };

  // ========================================
  // DOM ELEMENTS
  // ========================================
  const videoPreview = document.getElementById('videoPreview');
  const previewContainer = document.querySelector('.image-preview-container');
  
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10';
  
  let ctx = null;
  let isDetecting = false;
  let detectionInterval = null;
  let model = null;
  let lastAnnouncement = 0;
  let lastDetectedObjects = new Set();

  // ========================================
  // INITIALIZE ROBOFLOW
  // ========================================
  async function initializeRoboflow() {
    try {
      console.log('Roboflow API ready');
      console.log(`Endpoint: ${ROBOFLOW_CONFIG.apiBase}/${ROBOFLOW_CONFIG.modelId}/${ROBOFLOW_CONFIG.version}`);
      model = { ready: true };
      return true;
    } catch (error) {
      console.error('Error initializing Roboflow:', error);
      showError('Failed to initialize detection system');
      return false;
    }
  }

  // ========================================
  // SETUP CANVAS
  // ========================================
  function setupCanvas() {
    if (!previewContainer.contains(canvas)) {
      previewContainer.appendChild(canvas);
    }

    const rect = videoPreview.getBoundingClientRect();
    canvas.width = videoPreview.videoWidth || rect.width;
    canvas.height = videoPreview.videoHeight || rect.height;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx = canvas.getContext('2d');
  }

  // ========================================
  // START DETECTION
  // ========================================
  async function startDetection() {
    if (isDetecting) return;

    if (!model || !model.ready) {
      const initialized = await initializeRoboflow();
      if (!initialized) {
        showError('Could not initialize object detection');
        return;
      }
    }

    isDetecting = true;
    setupCanvas();

    const detectionDelay = 1000 / ROBOFLOW_CONFIG.fps;
    
    const runDetection = async () => {
      if (!isDetecting || !videoPreview.srcObject) {
        return;
      }

      try {
        await detectObjects();
      } catch (error) {
        console.error('Detection error:', error);
      }

      detectionInterval = setTimeout(runDetection, detectionDelay);
    };

    runDetection();
    console.log('Real-time detection started');
  }

  // ========================================
  // STOP DETECTION
  // ========================================
  function stopDetection() {
    isDetecting = false;
    if (detectionInterval) {
      clearTimeout(detectionInterval);
      detectionInterval = null;
    }
    
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    lastDetectedObjects.clear();
    console.log('Detection stopped');
  }

  // ========================================
  // DETECT OBJECTS
  // ========================================
  async function detectObjects() {
    if (!videoPreview || !videoPreview.videoWidth) {
      return;
    }

    try {
      const dataUrl = captureVideoFrameAsDataURL();
      if (!dataUrl) return;

      const apiUrl = `${ROBOFLOW_CONFIG.apiBase}/${ROBOFLOW_CONFIG.modelId}/${ROBOFLOW_CONFIG.version}`;
      
      const response = await fetch(`${apiUrl}?api_key=${ROBOFLOW_CONFIG.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: dataUrl
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      const predictions = Array.isArray(data?.predictions) ? data.predictions : [];

      const filteredPredictions = predictions.filter(
        p => (p.confidence * 100) >= ROBOFLOW_CONFIG.confidenceThreshold
      );

      drawDetections(filteredPredictions);
      announceDetections(filteredPredictions);

    } catch (error) {
      console.error('Error during detection:', error);
    }
  }

  // ========================================
  // CAPTURE VIDEO FRAME
  // ========================================
  function captureVideoFrameAsDataURL() {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoPreview.videoWidth;
      tempCanvas.height = videoPreview.videoHeight;

      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(videoPreview, 0, 0);

      return tempCanvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  // ========================================
  // DRAW DETECTIONS
  // ========================================
  function drawDetections(predictions) {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!predictions || predictions.length === 0) {
      return;
    }

    const scaleX = canvas.width / videoPreview.videoWidth;
    const scaleY = canvas.height / videoPreview.videoHeight;

    predictions.forEach(prediction => {
      const label = prediction.class.toLowerCase();
      const confidence = Math.round(prediction.confidence * 100);
      
      const color = OBJECT_COLORS[label] || OBJECT_COLORS['default'];

      const x = (prediction.x - prediction.width / 2) * scaleX;
      const y = (prediction.y - prediction.height / 2) * scaleY;
      const width = prediction.width * scaleX;
      const height = prediction.height * scaleY;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      const labelText = `${prediction.class} ${confidence}%`;
      ctx.font = 'bold 16px Arial';
      const textMetrics = ctx.measureText(labelText);
      const textHeight = 20;
      const padding = 4;

      ctx.fillStyle = color;
      ctx.fillRect(
        x, 
        y - textHeight - padding, 
        textMetrics.width + padding * 2, 
        textHeight + padding
      );

      ctx.fillStyle = '#000000';
      ctx.fillText(labelText, x + padding, y - padding - 2);

      if (label.includes('stair')) {
        flashBorder(color);
      }
    });
  }

    // ========================================
  // AUDIO PROMPTS (USING /public/audio FOLDER)
  // ========================================

  const AUDIO_PROMPTS = {
    // stairs / hagdan
    stairsWarning: {
      en: './audio/en/stairs.mp3',
      ta: './audio/ta/hagdan.mp3',
      ce: './audio/ce/stairs(ceb).mp3'
    },

    // person / tao
    personSingle: {
      en: './audio/en/person.mp3',
      ta: './audio/ta/tao.mp3',
      ce: './audio/ce/person(ceb).mp3'
    },
    personMultiple: {
      en: './audio/en/person.mp3',
      ta: './audio/ta/tao.mp3',
      ce: './audio/ce/person(ceb).mp3'
    },

    // door / pinto
    doorSingle: {
      en: './audio/en/door.mp3',
      ta: './audio/ta/pinto.mp3',
      ce: './audio/ce/door(ceb).mp3'
    },
    doorMultiple: {
      en: './audio/en/door.mp3',
      ta: './audio/ta/pinto.mp3',
      ce: './audio/ce/door(ceb).mp3'
    },

    // fallback for unknown objects – reuse "person" voice
    generic: {
      en: './audio/en/person.mp3',
      ta: './audio/ta/tao.mp3',
      ce: './audio/ce/person(ceb).mp3'
    }
  };

  function getCurrentLanguageCode() {
    let lang =
      window.currentLanguage ||
      window.appLanguage ||
      document.documentElement.lang ||
      'en';

    lang = String(lang).toLowerCase();

    // Tagalog
    if (lang === 'ta' || lang.startsWith('tl') || lang === 'tagalog' || lang.startsWith('fil')) {
      return 'ta';
    }

    // Cebuano
    if (lang === 'ce' || lang.startsWith('ceb') || lang === 'cebuano') {
      return 'ce';
    }

    // Default English
    return 'en';
  }

  // Reusable audio element
  const announcementAudio = new Audio();

  function playAudioPrompt(key) {
    const byLang = AUDIO_PROMPTS[key];
    if (!byLang) {
      console.warn('No audio prompt for key:', key);
      return;
    }

    const lang = getCurrentLanguageCode();
    const src = byLang[lang] || byLang.en;
    if (!src) {
      console.warn('No audio file for key/lang:', key, lang);
      return;
    }

    announcementAudio.src = src;
    announcementAudio.currentTime = 0;

    announcementAudio.play().catch(err => {
      console.log('Audio play blocked or failed:', err);
    });
  }

  // ========================================
  // ANNOUNCE DETECTIONS
  // ========================================

  function announceDetections(predictions) {
    if (!predictions || predictions.length === 0) {
      lastDetectedObjects.clear();
      return;
    }

    const now = Date.now();
    if (now - lastAnnouncement < 3000) {
      return;
    }

    const currentObjects = new Set(
      predictions.map(p => p.class.toLowerCase())
    );

    const hasNewObjects = Array.from(currentObjects).some(
      obj => !lastDetectedObjects.has(obj)
    );

    if (!hasNewObjects && lastDetectedObjects.size > 0) {
      return;
    }

    const sortedObjects = Array.from(currentObjects).sort((a, b) => {
      const priorityA = OBJECT_PRIORITY[a] || 0;
      const priorityB = OBJECT_PRIORITY[b] || 0;
      return priorityB - priorityA;
    });

    if (sortedObjects.length > 0) {
      const objectToAnnounce = sortedObjects[0];
      const count = predictions.filter(
        p => p.class.toLowerCase() === objectToAnnounce
      ).length;

      let message = '';
      let audioKey = 'generic';

      if (objectToAnnounce.includes('stair')) {
        message = window.t ? window.t('stairsWarning') : 'Warning! Stairs ahead';
        audioKey = 'stairsWarning';
        vibratePhone([200, 100, 200]);
      } else if (objectToAnnounce.includes('people') || objectToAnnounce.includes('person')) {
        if (count > 1) {
          message = window.t ? `${count} ${window.t('peopleDetected')}` : `${count} people detected`;
          audioKey = 'personMultiple';
        } else {
          message = window.t ? window.t('personDetected') : 'Person detected';
          audioKey = 'personSingle';
        }
      } else if (objectToAnnounce.includes('door')) {
        if (count > 1) {
          message = window.t ? `${count} ${window.t('doorsDetected')}` : `${count} doors detected`;
          audioKey = 'doorMultiple';
        } else {
          message = window.t ? window.t('doorAhead') : 'Door ahead';
          audioKey = 'doorSingle';
        }
      } else {
        message = window.t
          ? `${objectToAnnounce} ${window.t('objectDetected')}`
          : `${objectToAnnounce} detected`;
        audioKey = 'generic';
      }

      // 🔊 Use MP3 audio (works in WebView / mobile)
      playAudioPrompt(audioKey);

      // Optional: keep speechSynthesis for desktop browsers only
      if ('speechSynthesis' in window) {
        speak(message);
      }

      console.log('Announcement:', message);

      lastAnnouncement = now;
      lastDetectedObjects = currentObjects;
    }
  }

    // Current language used by the object-detection audio
  let detectionLanguage = 'en';

  function normalizeLanguageCode(lang) {
    if (!lang) return 'en';
    lang = String(lang).toLowerCase().trim();

    // Handle the codes you’re actually using: EN, TL, CEB, etc.
    if (lang === 'en' || lang === 'english' || lang.startsWith('en-')) {
      return 'en';
    }

    // Tagalog: EN/TL/TA/TAGALOG/FIL…
    if (
      lang === 'ta' ||
      lang === 'tl' ||
      lang === 'tagalog' ||
      lang.startsWith('tl') ||
      lang.startsWith('fil')
    ) {
      return 'ta'; // use /audio/ta/...
    }

    // Cebuano: CE/CEB/CEBU/CEBUANO…
    if (
      lang === 'ce' ||
      lang === 'ceb' ||
      lang === 'cebu' ||
      lang === 'cebuano' ||
      lang.startsWith('ceb')
    ) {
      return 'ce'; // use /audio/ce/...
    }

    // Default
    return 'en';
  }

  function setDetectionLanguage(lang) {
    detectionLanguage = normalizeLanguageCode(lang);
    console.log('Detection language set to:', detectionLanguage);
  }

  // ========================================
  // TEXT-TO-SPEECH
  // ========================================

  // Helper: detect current UI language
  function getCurrentLanguageCode() {
    return detectionLanguage;
  }

  // Helper: pick an appropriate voice for the language
  function pickVoiceForLanguage(langCode) {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;

    const prefsByLang = {
      en: ['en-PH', 'en-US', 'en-GB'],
      tl: ['fil-PH', 'tl-PH', 'en-PH'],
      ceb: ['ceb', 'fil-PH', 'tl-PH', 'en-PH']
    };

    const prefs = prefsByLang[langCode] || prefsByLang.en;

    for (const pref of prefs) {
      const v = voices.find(voice =>
        voice.lang.toLowerCase().startsWith(pref.toLowerCase())
      );
      if (v) return v;
    }
    return null;
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      console.log('Text-to-speech not supported:', text);
      return;
    }

    const langCode = getCurrentLanguageCode();

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Basic rate/pitch/volume
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Choose language code for the utterance
    if (langCode === 'tl') {
      utterance.lang = 'fil-PH'; // Tagalog / Filipino
    } else if (langCode === 'ceb') {
      // Many browsers don't have a Cebuano voice; use Filipino if not available
      utterance.lang = 'fil-PH';
    } else {
      utterance.lang = 'en-US';
    }

    // Try to pick an actual matching voice
    const voice = pickVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
    console.log(`Announced [${utterance.lang}]:`, text);
  }


  // ========================================
  // VIBRATION
  // ========================================
  function vibratePhone(pattern) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // ========================================
  // VISUAL ALERT
  // ========================================
  let flashTimeout = null;
  function flashBorder(color) {
    if (flashTimeout) return;

    previewContainer.style.border = `4px solid ${color}`;
    previewContainer.style.boxShadow = `0 0 20px ${color}`;

    flashTimeout = setTimeout(() => {
      previewContainer.style.border = '';
      previewContainer.style.boxShadow = '';
      flashTimeout = null;
    }, 300);
  }

  // ========================================
  // SHOW ERROR
  // ========================================
  function showError(message) {
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.textContent = message;
      placeholder.style.color = '#dc3545';
    }
    console.error(message);
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================
  
  document.addEventListener('cameraStarted', () => {
    console.log('Camera started, beginning detection...');
    setTimeout(() => {
      startDetection();
    }, 1000);
  });

  document.addEventListener('cameraStopped', () => {
    console.log('Camera stopped, stopping detection...');
    stopDetection();
  });

  videoPreview.addEventListener('loadedmetadata', () => {
    setupCanvas();
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (isDetecting) {
        setupCanvas();
      }
    }, 250);
  });

  window.addEventListener('beforeunload', () => {
    stopDetection();
  });

  // ========================================
  // INITIALIZE ON LOAD
  // ========================================
  window.addEventListener('DOMContentLoaded', () => {
    console.log('Object Detection System Ready');
    console.log('Using Roboflow Hosted API');
    console.log('Project: objdetection-dtu2z/trial-sjo4y/1');
    console.log('Languages: English (EN), Tagalog (TL), Cebuano (CEB)');
  });

  // ========================================
  // EXPOSE FUNCTIONS
  // ========================================
  window.objectDetection = {
    start: startDetection,
    stop: stopDetection,
    isActive: () => isDetecting,
    setLanguage: setDetectionLanguage   // 👈 new
  };


})();