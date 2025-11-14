// 🔹 Unique ID for this phone/device
const deviceId = "vision-device-1"; // change if you have more than one box

// 🔹 Connect back to SAME origin as the page (no URL needed)
const socket = io({
  transports: ["websocket"],
});

// When connected, register this device
socket.on("connect", () => {
  console.log("[remote] device connected:", socket.id);
  socket.emit("registerDevice", { deviceId });
});

// Handle commands from the controller
socket.on("command", (cmd) => {
  console.log("[remote] command received:", cmd);

  if (cmd && cmd.type === "SET_LANGUAGE" && cmd.payload?.lang) {
    const lang = cmd.payload.lang;

    // Only allow languages you actually support
    if (window.translations && window.translations[lang]) {
      console.log("[remote] changing language to:", lang);
      // use your existing function
      window.changeLanguage(lang);
    } else {
      console.warn("[remote] unsupported language:", lang);
    }
  }
});
