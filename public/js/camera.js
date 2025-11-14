// Camera Control Script
(function() {
  'use strict';

  // Get DOM elements
  const useCameraBtn = document.getElementById('useCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const videoPreview = document.getElementById('videoPreview');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Camera state
  let stream = null;
  let isCameraActive = false;

  // Check if browser supports getUserMedia
  const hasGetUserMedia = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Request camera access
  async function startCamera() {
    if (!hasGetUserMedia()) {
      showError('Camera is not supported by your browser');
      return;
    }

    try {
      // Show loading state
      showLoading(true);
      useCameraBtn.disabled = true;

      // Request camera access
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Set up video element
      videoPreview.srcObject = stream;
      videoPreview.style.display = 'block';
      previewPlaceholder.style.display = 'none';

      // Update button states
      isCameraActive = true;
      useCameraBtn.style.display = 'none';
      stopCameraBtn.style.display = 'inline-flex';

      // Hide loading
      showLoading(false);

      // Optional: Add success feedback
      showSuccess('Camera started successfully');

      // Dispatch event for detection to start
      document.dispatchEvent(new CustomEvent('cameraStarted'));

    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Failed to access camera';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not meet the required constraints.';
      }

      showError(errorMessage);
      showLoading(false);
      useCameraBtn.disabled = false;
    }
  }

  // Stop camera
  function stopCamera() {
    if (stream) {
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    // Reset UI
    videoPreview.srcObject = null;
    videoPreview.style.display = 'none';
    previewPlaceholder.style.display = 'block';
    previewPlaceholder.textContent = 'Click "Use Camera" to start detection';

    // Update button states
    isCameraActive = false;
    useCameraBtn.style.display = 'inline-flex';
    stopCameraBtn.style.display = 'none';
    useCameraBtn.disabled = false;

    // Optional: Add feedback
    showSuccess('Camera stopped');

    // Dispatch event for detection to stop
    document.dispatchEvent(new CustomEvent('cameraStopped'));
  }

  // Show loading state
  function showLoading(show) {
    if (show) {
      loadingSpinner.style.display = 'flex';
      previewPlaceholder.style.display = 'none';
      videoPreview.style.display = 'none';
    } else {
      loadingSpinner.style.display = 'none';
    }
  }

  // Show error message
  function showError(message) {
    previewPlaceholder.textContent = message;
    previewPlaceholder.style.display = 'block';
    previewPlaceholder.style.color = '#dc3545';
    
    // Reset color after 5 seconds
    setTimeout(() => {
      previewPlaceholder.style.color = '';
    }, 5000);
  }

  // Show success message (optional)
  function showSuccess(message) {
    // You can implement a toast notification here if desired
    console.log('Success:', message);
  }

  // Event Listeners
  useCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (isCameraActive) {
      stopCamera();
    }
  });

  // Handle page visibility change (stop camera when tab is hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isCameraActive) {
      // Optionally pause the camera when tab is hidden
      console.log('Page hidden, camera still active');
    }
  });

  // Check camera permissions on load (optional)
  if (hasGetUserMedia()) {
    navigator.permissions.query({ name: 'camera' }).then((result) => {
      if (result.state === 'granted') {
        console.log('Camera permission already granted');
      } else if (result.state === 'prompt') {
        console.log('Camera permission will be requested');
      } else if (result.state === 'denied') {
        console.log('Camera permission denied');
        previewPlaceholder.textContent = 'Camera access denied. Please enable camera permissions in your browser settings.';
      }
    }).catch(() => {
      // Permissions API not supported, that's okay
      console.log('Permissions API not supported');
    });
  } else {
    previewPlaceholder.textContent = 'Camera is not supported by your browser';
    useCameraBtn.disabled = true;
    useCameraBtn.style.opacity = '0.5';
    useCameraBtn.style.cursor = 'not-allowed';
  }

    // --- Remote camera control API (for Socket.IO) ---
  if (typeof window !== 'undefined') {
    window.remoteCamera = {
      start() {
        // huwag paulit-ulit kung naka-on na
        if (!isCameraActive) {
          startCamera();
        }
      },
      stop() {
        if (isCameraActive) {
          stopCamera();
        }
      },
      isActive() {
        return isCameraActive;
      }
    };
  }

})();