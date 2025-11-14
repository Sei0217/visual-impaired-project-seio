// 🔹 Unique ID for this phone/device
// Generate a persistent ID or use device-specific identifier
const deviceId = (() => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'vision-device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', id);
  }
  return id;
})();

console.log("[remote-device] Device ID:", deviceId);

// 🔹 Detect if running in WebView or browser
const isWebView = (() => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.indexOf('wv') > -1 || // Android WebView
    ua.indexOf('iphone') > -1 || // iOS
    ua.indexOf('ipad') > -1 ||
    (window.navigator.standalone === true) || // iOS standalone
    (window.matchMedia('(display-mode: standalone)').matches) // PWA
  );
})();

console.log("[remote-device] Running in WebView:", isWebView);

// 🔹 Socket.IO configuration optimized for WebView
const socketConfig = {
  // IMPORTANT: Polling works better in WebViews
  transports: ["polling", "websocket"], // Try polling FIRST for WebViews
  
  // Increase timeouts for mobile networks
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity, // Keep trying
  timeout: 30000, // 30 seconds
  
  // Force new connection
  forceNew: false,
  
  // Upgrade to websocket after initial polling connection
  upgrade: true,
  rememberUpgrade: true,
  
  // Add query params for debugging
  query: {
    deviceId: deviceId,
    platform: isWebView ? 'webview' : 'browser',
    ua: navigator.userAgent
  }
};

// 🔹 Connect to server
let socket;
let connectionAttempts = 0;
let isConnected = false;

function initializeSocket() {
  console.log("[remote-device] Initializing socket connection...");
  console.log("[remote-device] Config:", socketConfig);
  
  try {
    socket = io(socketConfig);
    setupSocketHandlers();
  } catch (error) {
    console.error("[remote-device] Failed to initialize socket:", error);
    showConnectionStatus("Failed to initialize: " + error.message, "error");
  }
}

// 🔹 Setup all socket event handlers
function setupSocketHandlers() {
  // Connection successful
  socket.on("connect", () => {
    connectionAttempts = 0;
    isConnected = true;
    console.log("[remote-device] ✅ Connected:", socket.id);
    console.log("[remote-device] Transport:", socket.io.engine.transport.name);
    
    // Register this device
    socket.emit("registerDevice", { deviceId });
    
    showConnectionStatus("🟢 Remote control connected", "success");
  });

  // Registration confirmed
  socket.on("registered", (data) => {
    console.log("[remote-device] ✅ Registered successfully:", data);
    showConnectionStatus("✓ Registered to remote control", "success");
    
    // Store connection info
    localStorage.setItem('lastConnected', new Date().toISOString());
  });

  // Disconnected
  socket.on("disconnect", (reason) => {
    isConnected = false;
    console.warn("[remote-device] ❌ Disconnected:", reason);
    
    if (reason === 'io server disconnect') {
      // Server disconnected us, reconnect manually
      console.log("[remote-device] Server disconnected, reconnecting...");
      socket.connect();
    }
    
    showConnectionStatus("🔴 Remote control disconnected", "warning");
  });

  // Connection error
  socket.on("connect_error", (error) => {
    connectionAttempts++;
    console.error("[remote-device] ⚠️ Connection error #" + connectionAttempts + ":", error.message);
    console.error("[remote-device] Error type:", error.type);
    console.error("[remote-device] Error description:", error.description);
    
    showConnectionStatus(
      `Connection error (attempt ${connectionAttempts}): ${error.message}`, 
      "error"
    );
  });

  // Reconnecting
  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("[remote-device] 🔄 Reconnection attempt:", attemptNumber);
    showConnectionStatus(`Reconnecting... (${attemptNumber})`, "warning");
  });

  // Reconnected successfully
  socket.on("reconnect", (attemptNumber) => {
    console.log("[remote-device] 🔄 Reconnected after", attemptNumber, "attempts");
    showConnectionStatus("✓ Reconnected to remote control", "success");
  });

  // Failed to reconnect
  socket.on("reconnect_failed", () => {
    console.error("[remote-device] ❌ Reconnection failed");
    showConnectionStatus("Failed to reconnect. Please refresh.", "error");
  });

  // Ping/Pong monitoring
  socket.on("ping", () => {
    console.log("[remote-device] 🏓 Ping from server");
  });

  socket.on("pong", (latency) => {
    console.log("[remote-device] 🏓 Pong - Latency:", latency, "ms");
  });

  // Transport upgrade (polling -> websocket)
  socket.io.engine.on("upgrade", (transport) => {
    console.log("[remote-device] ⬆️ Transport upgraded to:", transport.name);
  });

  // Command received
  socket.on("command", handleCommand);
}

// 🔹 Command handler
function handleCommand(cmd) {
  console.log("[remote-device] 📨 Command received:", cmd);
  
  if (!cmd || !cmd.type) {
    console.warn("[remote-device] ⚠️ Invalid command format");
    return;
  }

  // Acknowledge receipt
  socket.emit("deviceStatus", {
    deviceId,
    action: "command_received",
    commandType: cmd.type,
    timestamp: Date.now()
  });

  try {
    switch (cmd.type) {
      case "SET_LANGUAGE":
        if (cmd.payload?.lang) {
          remoteSetLanguage(cmd.payload.lang);
        } else {
          console.warn("[remote-device] ⚠️ No language specified");
        }
        break;

      case "START_CAMERA":
        remoteStartCamera();
        break;

      case "STOP_CAMERA":
        remoteStopCamera();
        break;

      case "PING":
        // Respond to ping
        socket.emit("deviceStatus", {
          deviceId,
          action: "pong",
          connected: isConnected,
          transport: socket?.io?.engine?.transport?.name || "unknown",
          timestamp: Date.now()
        });
        break;

      case "REFRESH":
        // Reload the page
        console.log("[remote-device] 🔄 REFRESH command");
        window.location.reload();
        break;

      case "GET_STATUS":
        // Send current status
        socket.emit("deviceStatus", {
          deviceId,
          action: "status_report",
          connected: isConnected,
          transport: socket?.io?.engine?.transport?.name || "unknown",
          userAgent: navigator.userAgent,
          isWebView: isWebView,
          timestamp: Date.now()
        });
        break;

      default:
        console.warn("[remote-device] ⚠️ Unknown command type:", cmd.type);
    }
  } catch (error) {
    console.error("[remote-device] ❌ Error executing command:", error);
    socket.emit("deviceStatus", {
      deviceId,
      action: "command_error",
      commandType: cmd.type,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// 🔹 Helper Functions

// Show connection status to user
function showConnectionStatus(message, type = "info") {
  console.log(`[remote-device] [${type}]`, message);
  
  const statusEl = document.getElementById("remoteStatus");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status-${type}`;
    
    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "";
      }, 3000);
    }
  }
}

// Remote language change
function remoteSetLanguage(lang) {
  if (window.translations && window.translations[lang] && typeof window.changeLanguage === "function") {
    console.log("[remote-device] 🌐 Changing language to:", lang);
    window.changeLanguage(lang);
    
    // Send confirmation
    socket.emit("deviceStatus", {
      deviceId,
      action: "language_changed",
      language: lang,
      timestamp: Date.now()
    });
  } else {
    console.warn("[remote-device] ⚠️ Unsupported language:", lang);
  }
}

// Remote camera control
function remoteStartCamera() {
  const btn = document.getElementById("useCameraBtn");
  if (btn) {
    console.log("[remote-device] 📷 START_CAMERA via button click");
    btn.click();
    
    socket.emit("deviceStatus", {
      deviceId,
      action: "camera_started",
      timestamp: Date.now()
    });
  } else {
    console.warn("[remote-device] ⚠️ useCameraBtn not found");
  }
}

function remoteStopCamera() {
  const btn = document.getElementById("stopCameraBtn");
  if (btn) {
    console.log("[remote-device] 📷 STOP_CAMERA via button click");
    btn.click();
    
    socket.emit("deviceStatus", {
      deviceId,
      action: "camera_stopped",
      timestamp: Date.now()
    });
  } else {
    console.warn("[remote-device] ⚠️ stopCameraBtn not found");
  }
}

// 🔹 Expose socket and deviceId globally
Object.defineProperty(window, 'remoteSocket', {
  get() { return socket; }
});

window.remoteDeviceId = deviceId;

// 🔹 Connection monitoring
let connectionCheckInterval;

function startConnectionMonitoring() {
  // Check connection every 30 seconds
  connectionCheckInterval = setInterval(() => {
    if (socket && socket.connected) {
      console.log("[remote-device] Connection check: OK");
    } else {
      console.warn("[remote-device] Connection check: DISCONNECTED");
      if (socket && !socket.connected) {
        console.log("[remote-device] Attempting reconnection...");
        socket.connect();
      }
    }
  }, 30000);
}

function stopConnectionMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
}

// 🔹 Visibility change handler (for mobile apps going to background)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("[remote-device] App went to background");
    // Don't disconnect, but stop monitoring
    stopConnectionMonitoring();
  } else {
    console.log("[remote-device] App came to foreground");
    // Restart monitoring and reconnect if needed
    startConnectionMonitoring();
    if (socket && !socket.connected) {
      console.log("[remote-device] Reconnecting after background...");
      socket.connect();
    }
  }
});

// 🔹 Initialize on load
console.log("[remote-device] Script loaded");
console.log("[remote-device] Device ID:", deviceId);
console.log("[remote-device] Is WebView:", isWebView);
console.log("[remote-device] User Agent:", navigator.userAgent);

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    startConnectionMonitoring();
  });
} else {
  initializeSocket();
  startConnectionMonitoring();
}

// 🔹 Cleanup on page unload
window.addEventListener("beforeunload", () => {
  console.log("[remote-device] Page unloading, cleaning up...");
  stopConnectionMonitoring();
  if (socket) {
    socket.disconnect();
  }
});