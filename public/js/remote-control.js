// === Device detection ===

// 1) Optional: check query param ?device=...
const params = new URLSearchParams(window.location.search);
let deviceId = params.get("device"); // e.g. ?device=vision-device-1

// 2) If no ?device=..., try to detect Android WebView (yung app)
if (!deviceId) {
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  const isAndroid = /Android/i.test(ua);

  // Very rough Android WebView detection:
  // - may "wv" (WebView) sa UA, or
  // - may "Version/x.x" pero hindi yung full Chrome browser
  const isWebView =
    /\bwv\b/i.test(ua) ||
    (/\bVersion\/\d+\.\d+\b/i.test(ua) && !/Chrome\/\d+/i.test(ua));

  if (isAndroid && isWebView) {
    deviceId = "vision-device-1"; // 👉 fixed ID para sa Android app
  }
}

if (!deviceId) {
  console.log(
    "[remote-device] Not in device mode (no ?device=... and not Android WebView) → skipping Socket.IO setup"
  );
  // Normal visitor lang ’to (desktop / mobile browser) – walang remote control
} else {
  console.log("[remote-device] Device mode detected with deviceId:", deviceId);

  // === Socket.IO setup ===

  const socket = io({
    transports: ["websocket"],
  });

  // expose for other scripts (preview, etc.)
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

    // 👉 sabay natin paandarin ang preview kung available
    if (typeof window.startPreview === "function") {
      window.startPreview();
    }
  } else {
    console.warn("[remote-device] useCameraBtn not found");
  }
}

function remoteStopCamera() {
  const btn = document.getElementById("stopCameraBtn");
  if (btn) {
    console.log("[remote-device] STOP_CAMERA via button click");
    btn.click();

    // 👉 sabay natin patigilin ang preview kung available
    if (typeof window.stopPreview === "function") {
      window.stopPreview();
    }
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
