// 🔹 1) Check query param: ?device=1
const params = new URLSearchParams(window.location.search);
const isDeviceParam = params.get("device") === "1";

// 🔹 2) Check if Android
const ua = navigator.userAgent || navigator.vendor || window.opera;
const isAndroid = /Android/i.test(ua);

// 🔹 3) Only treat this as a "device" if BOTH are true
const isDeviceMode = isDeviceParam && isAndroid;

if (!isDeviceMode) {
  console.log("[remote-device] Not in Android device mode, skipping Socket.IO setup");
  // Normal website visitor / non-Android → walang remote control
} else {
  console.log("[remote-device] Android device mode detected, setting up remote control");

  // 🔹 Unique ID for this Android device
  const deviceId = "vision-device-1"; // ito yung gusto mo

  // 🔹 Connect to SAME origin (localhost / Render / etc.)
  const socket = io({
    transports: ["websocket"],
  });

  // optional expose to window
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

  // --- Main command handler ---

  socket.on("command", (cmd) => {
    console.log("[remote-device] command received:", cmd);
    if (!cmd || !cmd.type) return;

    switch (cmd.type) {
      case "SET_LANGUAGE":
        if (cmd.payload && cmd.payload.lang) {
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
}
