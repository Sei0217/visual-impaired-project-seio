// 🔹 Device ID Management
const DEVICE_ID = (() => {
  // Check if running in a production environment
  const isProduction = window.location.hostname !== "localhost";
  
  if (isProduction) {
    return "visual-impaired-cane-01";
  }
  
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'dev-cane-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', id);
  }
  return id;
})();

console.log("═══════════════════════════════════════════");
console.log("🎓 THESIS PROJECT: Visual Impaired Cane System");
console.log("📱 Device ID:", DEVICE_ID);
console.log("🌐 Server:", window.location.origin);
console.log("═══════════════════════════════════════════");

function displayDeviceId() {
  const existingBanner = document.getElementById("deviceIdBanner");
  if (existingBanner) return;
  
  const banner = document.createElement("div");
  banner.id = "deviceIdBanner";
  banner.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    font-size: 14px;
    font-family: monospace;
    z-index: 10000;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  banner.innerHTML = `
    <div>
      <strong>🎓 Device ID:</strong> 
      <code style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; margin-left: 8px;">
        ${DEVICE_ID}
      </code>
    </div>
    <button onclick="this.parentElement.remove()" 
            style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
      ✕ Hide
    </button>
  `;
  
  document.body.appendChild(banner);
}

// Show banner after 2 seconds (after page loads)
setTimeout(displayDeviceId, 2000);

// 🔹 Connection Statistics
const connectionStats = {
  connectTime: null,
  disconnectCount: 0,
  reconnectCount: 0,
  commandsReceived: 0,
  commandsExecuted: 0,
  errors: [],
  startTime: Date.now(),
  
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  },
  
  getSummary() {
    return {
      deviceId: DEVICE_ID,
      uptime: this.getUptime(),
      connected: socket?.connected || false,
      transport: socket?.io?.engine?.transport?.name || "N/A",
      disconnectCount: this.disconnectCount,
      reconnectCount: this.reconnectCount,
      commandsReceived: this.commandsReceived,
      commandsExecuted: this.commandsExecuted,
      errorCount: this.errors.length,
      lastError: this.errors[this.errors.length - 1] || null
    };
  }
};

// Expose stats for debugging
window.getConnectionStats = () => connectionStats.getSummary();

// 🔹 Socket.IO Configuration
const socket = io({
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity,
  timeout: 30000,
  query: {
    deviceId: DEVICE_ID,
    projectType: "thesis-visual-impaired-cane",
    version: "1.0.0"
  }
});

let isConnected = false;

// 🔹 Connection Event Handlers
socket.on("connect", () => {
  isConnected = true;
  connectionStats.connectTime = Date.now();
  
  console.log("✅ [CONNECTED] Socket ID:", socket.id);
  console.log("📡 [TRANSPORT]", socket.io.engine.transport.name);
  
  // Register device
  socket.emit("registerDevice", { deviceId: DEVICE_ID });
  
  showStatus("🟢 Connected to remote control", "success");
});

socket.on("registered", (data) => {
  console.log("✅ [REGISTERED]", data);
  showStatus("✓ Ready for remote control", "success");
  
  // Send initial status for monitoring
  sendDeviceStatus("device_ready", {
    capabilities: ["camera", "language_switch", "audio_feedback"],
    batteryLevel: navigator.getBattery ? "checking..." : "N/A",
    networkType: navigator.connection?.effectiveType || "unknown"
  });
});

socket.on("disconnect", (reason) => {
  isConnected = false;
  connectionStats.disconnectCount++;
  
  console.warn("❌ [DISCONNECTED]", reason);
  showStatus("🔴 Disconnected from control", "error");
});

socket.on("connect_error", (error) => {
  connectionStats.errors.push({
    time: new Date().toISOString(),
    type: "connection_error",
    message: error.message
  });
  
  console.error("⚠️ [ERROR]", error.message);
  showStatus("Connection error", "error");
});

socket.on("reconnect", (attemptNumber) => {
  connectionStats.reconnectCount++;
  console.log("🔄 [RECONNECTED] After", attemptNumber, "attempts");
  showStatus("✓ Reconnected", "success");
});

socket.io.engine.on("upgrade", (transport) => {
  console.log("⬆️ [UPGRADE]", transport.name);
});

// 🔹 Command Handler with Statistics
socket.on("command", (cmd) => {
  connectionStats.commandsReceived++;
  
  console.log("📨 [COMMAND]", cmd.type, cmd.payload || "");
  
  if (!cmd || !cmd.type) {
    console.warn("⚠️ Invalid command format");
    return;
  }

  try {
    executeCommand(cmd);
    connectionStats.commandsExecuted++;
  } catch (error) {
    connectionStats.errors.push({
      time: new Date().toISOString(),
      type: "command_execution_error",
      command: cmd.type,
      message: error.message
    });
    
    console.error("❌ [ERROR] Executing command:", error);
    sendDeviceStatus("command_error", {
      command: cmd.type,
      error: error.message
    });
  }
});

// 🔹 Command Execution
function executeCommand(cmd) {
  const startTime = Date.now();
  
  switch (cmd.type) {
    case "SET_LANGUAGE":
      if (cmd.payload?.lang) {
        changeLanguage(cmd.payload.lang);
      }
      break;

    case "START_CAMERA":
      startCamera();
      break;

    case "STOP_CAMERA":
      stopCamera();
      break;

    case "CAPTURE_PHOTO":
      capturePhoto();
      break;

    case "START_LIVE_PREVIEW":
      startLivePreview();
      break;

    case "STOP_LIVE_PREVIEW":
      stopLivePreview();
      break;

    case "PING":
      sendDeviceStatus("pong", {
        latency: Date.now() - (cmd.timestamp || Date.now()),
        stats: connectionStats.getSummary()
      });
      break;

    case "GET_STATS":
      sendDeviceStatus("stats_report", connectionStats.getSummary());
      break;

    case "REFRESH":
      console.log("🔄 [REFRESH] Reloading application...");
      setTimeout(() => window.location.reload(), 500);
      break;

    default:
      console.warn("⚠️ Unknown command:", cmd.type);
      sendDeviceStatus("unknown_command", { commandType: cmd.type });
  }
  
  const executionTime = Date.now() - startTime;
  console.log(`⏱️ [TIMING] ${cmd.type} executed in ${executionTime}ms`);
}

// 🔹 Helper Functions
function showStatus(message, type = "info") {
  console.log(`[STATUS] ${message}`);
  
  const statusEl = document.getElementById("remoteStatus");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `remote-status status-${type}`;
    
    if (type === "success") {
      setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "";
      }, 3000);
    }
  }
}

function sendDeviceStatus(action, data = {}) {
  socket.emit("deviceStatus", {
    deviceId: DEVICE_ID,
    action: action,
    timestamp: Date.now(),
    ...data
  });
}

function changeLanguage(lang) {
  if (window.changeLanguage && typeof window.changeLanguage === "function") {
    console.log("🌐 [LANGUAGE] Changing to:", lang);
    window.changeLanguage(lang);
    showStatus(`Language: ${lang}`, "success");
    sendDeviceStatus("language_changed", { language: lang });
  } else {
    console.warn("⚠️ changeLanguage function not found");
  }
}

function startCamera() {
  const btn = document.getElementById("useCameraBtn");
  if (btn) {
    console.log("📷 [CAMERA] Starting...");
    btn.click();
    showStatus("Camera started", "success");
    sendDeviceStatus("camera_started");
  } else {
    console.warn("⚠️ Camera button not found");
  }
}

function stopCamera() {
  const btn = document.getElementById("stopCameraBtn");
  if (btn) {
    console.log("📷 [CAMERA] Stopping...");
    btn.click();
    showStatus("Camera stopped", "success");
    sendDeviceStatus("camera_stopped");
  } else {
    console.warn("⚠️ Stop camera button not found");
  }
}

function capturePhoto() {
  const btn = document.getElementById("captureBtn") || document.querySelector("[data-action='capture']");
  if (btn) {
    console.log("📸 [CAPTURE] Taking photo...");
    btn.click();
    sendDeviceStatus("photo_captured");
  }
}

// 🔹 Live Preview with Frame Rate Control
let streamInterval = null;
let framesSent = 0;

function startLivePreview() {
  const video = document.getElementById("videoElement") || document.querySelector("video");
  if (!video) {
    console.warn("⚠️ Video element not found");
    return;
  }

  console.log("📡 [PREVIEW] Starting live stream...");
  framesSent = 0;
  
  // Send frames at 5 FPS (200ms interval)
  streamInterval = setInterval(() => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const frame = canvas.toDataURL("image/jpeg", 0.6);
      socket.emit("videoFrame", {
        deviceId: DEVICE_ID,
        frame: frame,
        timestamp: Date.now(),
        frameNumber: ++framesSent
      });
    }
  }, 200);

  sendDeviceStatus("live_preview_started");
}

function stopLivePreview() {
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
    console.log(`📡 [PREVIEW] Stopped. Frames sent: ${framesSent}`);
    sendDeviceStatus("live_preview_stopped", { totalFrames: framesSent });
  }
}

// 🔹 Visibility Handler (for thesis - monitor app lifecycle)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("📱 [LIFECYCLE] App backgrounded");
    sendDeviceStatus("app_backgrounded");
  } else {
    console.log("📱 [LIFECYCLE] App foregrounded");
    sendDeviceStatus("app_foregrounded");
    
    // Reconnect if disconnected
    if (!socket.connected) {
      console.log("🔄 Reconnecting after foreground...");
      socket.connect();
    }
  }
});

// 🔹 Battery Monitoring
if (navigator.getBattery) {
  navigator.getBattery().then(battery => {
    console.log("🔋 [BATTERY] Level:", Math.round(battery.level * 100) + "%");
    
    battery.addEventListener('levelchange', () => {
      const level = Math.round(battery.level * 100);
      if (level <= 20) {
        console.warn("⚠️ [BATTERY] Low battery:", level + "%");
        sendDeviceStatus("low_battery", { level: level });
      }
    });
  });
}

// 🔹 Expose API
window.remoteControl = {
  socket: socket,
  deviceId: DEVICE_ID,
  getStats: () => connectionStats.getSummary(),
  sendTestCommand: (type, payload) => executeCommand({ type, payload }),
  isConnected: () => isConnected
};

console.log("🎓 [INIT] Remote control system initialized");
console.log("💡 [TIP] Use window.getConnectionStats() to view statistics");