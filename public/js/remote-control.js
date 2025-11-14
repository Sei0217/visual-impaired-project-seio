// 🔹 Unique ID for this phone/device
const deviceId = "vision-device-1"; // palitan kung may multiple devices

// 🔹 Connect to SAME origin (localhost / Render / etc.)
const socket = io({
  transports: ["websocket"],
});

// Optional: expose sa window for debugging
window.remoteSocket = socket;
window.remoteDeviceId = deviceId;

socket.on("connect", () => {
  console.log("[remote-device] connected:", socket.id);
  socket.emit("registerDevice", { deviceId });
});

// --- Helpers ---

// 1) Language change – reuse existing changeLanguage()
function remoteSetLanguage(lang) {
  if (
    window.translations &&
    window.translations[lang] &&
    typeof window.changeLanguage === "function"
  ) {
    console.log("[remote-device] change language to:", lang);
    window.changeLanguage(lang);
  } else {
    console.warn("[remote-device] unsupported lang:", lang);
  }
}

// 2) Camera control – simulate button click
function remoteStartCamera() {
  const btn = document.getElementById("useCameraBtn");
  if (btn) {
    console.log("[remote-device] START_CAMERA via button click");
    btn.click();
  } else {
    console.warn("[remote-device] useCameraBtn not found");
  }
}

function remoteStopCamera() {
  const btn = document.getElementById("stopCameraBtn");
  if (btn) {
    console.log("[remote-device] STOP_CAMERA via button click");
    btn.click();
  } else {
    console.warn("[remote-device] stopCameraBtn not found");
  }
}

// 3) Preview streaming – send frames to server

let previewInterval = null;
let previewCanvas = null;
let previewCtx = null;

function startPreviewStreaming() {
  if (previewInterval) {
    console.log("[remote-device] preview already running");
    return;
  }

  const video = document.getElementById("videoPreview");
  if (!video) {
    console.warn("[remote-device] videoPreview element not found");
    return;
  }

  // create / reuse hidden canvas
  if (!previewCanvas) {
    previewCanvas = document.createElement("canvas");
    previewCtx = previewCanvas.getContext("2d");
  }

  console.log("[remote-device] starting preview streaming");

  // Send frame every 800ms (~1–2 fps)
  previewInterval = setInterval(() => {
    // need valid video frame
    if (!video.videoWidth || !video.videoHeight) return;

    const maxWidth = 320; // adjust as needed (smaller = less data)
    const scale = Math.min(
      maxWidth / video.videoWidth,
      maxWidth / video.videoHeight
    );

    const w = Math.max(1, Math.floor(video.videoWidth * scale));
    const h = Math.max(1, Math.floor(video.videoHeight * scale));
    previewCanvas.width = w;
    previewCanvas.height = h;

    previewCtx.drawImage(video, 0, 0, w, h);

    const dataUrl = previewCanvas.toDataURL("image/jpeg", 0.4); // 0.0–1.0 quality

    socket.emit("previewFrame", {
      deviceId,
      image: dataUrl,
    });
  }, 800);
}

function stopPreviewStreaming() {
  if (previewInterval) {
    clearInterval(previewInterval);
    previewInterval = null;
    console.log("[remote-device] stopped preview streaming");
  }
}

// --- Main command handler ---

socket.on("command", (cmd) => {
  console.log("[remote-device] command received:", cmd);
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

    case "START_PREVIEW":
      startPreviewStreaming();
      break;

    case "STOP_PREVIEW":
      stopPreviewStreaming();
      break;

    default:
      console.warn("[remote-device] unknown command type:", cmd.type);
  }
});
