// 🔹 Unique ID for this device
const deviceId = "vision-device-1";

// 🔹 Connect to the same origin (server kung saan galing ang page)
const socket = io({
  transports: ["websocket"],
});

// Gawing globally visible para kung kailangan sa ibang script
window.remoteSocket = socket;
window.remoteDeviceId = deviceId;

socket.on("connect", () => {
  console.log("[remote] device connected:", socket.id);
  socket.emit("registerDevice", { deviceId });
});

// --- Helpers ---

function remoteSetLanguage(lang) {
  if (window.translations && window.translations[lang] && window.changeLanguage) {
    window.changeLanguage(lang);
  } else {
    console.warn("[remote] unknown language:", lang);
  }
}

function remoteStartCamera() {
  if (window.remoteCamera && typeof window.remoteCamera.start === "function") {
    window.remoteCamera.start();
  } else {
    console.warn("[remote] remoteCamera.start not available");
  }
}

function remoteStopCamera() {
  if (window.remoteCamera && typeof window.remoteCamera.stop === "function") {
    window.remoteCamera.stop();
  } else {
    console.warn("[remote] remoteCamera.stop not available");
  }
}

// --- Realtime preview streaming ---

let previewInterval = null;

function startPreviewStreaming() {
  if (previewInterval) return; // already running

  const video = document.getElementById("videoPreview");
  if (!video) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  previewInterval = setInterval(() => {
    if (!window.remoteCamera || !window.remoteCamera.isActive()) return;
    if (!video.videoWidth || !video.videoHeight) return;

    // Downscale para tipid sa bandwidth
    const maxWidth = 320; // pwede babaan/taasan
    const scale = Math.min(
      maxWidth / video.videoWidth,
      maxWidth / video.videoHeight
    );

    const w = Math.floor(video.videoWidth * scale);
    const h = Math.floor(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.4); // 0.4 = quality

    socket.emit("previewFrame", {
      deviceId,
      image: dataUrl,
    });
  }, 500); // every 500ms ≈ 2 FPS
}

function stopPreviewStreaming() {
  if (previewInterval) {
    clearInterval(previewInterval);
    previewInterval = null;
  }
}

// Auto start/stop preview kapag nag-start/stop ang camera
document.addEventListener("cameraStarted", () => {
  console.log("[remote] cameraStarted → startPreviewStreaming");
  startPreviewStreaming();
});

document.addEventListener("cameraStopped", () => {
  console.log("[remote] cameraStopped → stopPreviewStreaming");
  stopPreviewStreaming();
});

// --- Commands from controller ---

socket.on("command", (cmd) => {
  console.log("[remote] command:", cmd);

  if (!cmd || !cmd.type) return;

  switch (cmd.type) {
    case "SET_LANGUAGE":
      if (cmd.payload?.lang) {
        remoteSetLanguage(cmd.payload.lang);
      }
      break;

    case "START_CAMERA":
      remoteStartCamera();
      break;

    case "STOP_CAMERA":
      remoteStopCamera();
      break;

    // optional kung gusto mong i-on/off ang preview nang hiwalay
    case "START_PREVIEW":
      startPreviewStreaming();
      break;

    case "STOP_PREVIEW":
      stopPreviewStreaming();
      break;

    default:
      console.warn("[remote] unknown command type:", cmd.type);
  }
});
