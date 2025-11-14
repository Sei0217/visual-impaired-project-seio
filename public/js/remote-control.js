// 🔹 Unique ID for this phone/device
const deviceId = "vision-device-1"; // palitan kung maraming device

// 🔹 Connect to the SAME origin as the page (localhost/render/etc.)
const socket = io({
  transports: ["websocket"],
});

// (optional pero useful kung gusto mo i-access sa ibang script)
window.remoteSocket = socket;
window.remoteDeviceId = deviceId;

socket.on("connect", () => {
  console.log("[remote-device] connected:", socket.id);
  socket.emit("registerDevice", { deviceId });
});

// --- Helpers ---

// Remote language change – reuse existing changeLanguage()
function remoteSetLanguage(lang) {
  if (window.translations && window.translations[lang] && typeof window.changeLanguage === "function") {
    console.log("[remote-device] change language to:", lang);
    window.changeLanguage(lang);
  } else {
    console.warn("[remote-device] unsupported lang:", lang);
  }
}

// Remote camera control – simulate button click
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

    default:
      console.warn("[remote-device] unknown command type:", cmd.type);
  }
});
