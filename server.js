import express from "express";
import fs from "fs";
import https from "https";
import http from "http";
import path from "path";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io"; 

dotenv.config();
 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
 
const SSL_KEY = path.join(__dirname, "server.key");
const SSL_CERT = path.join(__dirname, "server.cert");
const ENV = process.env.NODE_ENV || "development";
 
// HTTPS logic for development
let server;
if (
  ENV === "development" &&
  fs.existsSync(SSL_KEY) &&
  fs.existsSync(SSL_CERT)
) {
  server = https.createServer(
    {
      key: fs.readFileSync(SSL_KEY),
      cert: fs.readFileSync(SSL_CERT),
    },
    app
  );
  console.log("✅ HTTPS enabled for development");
} else {
  server = http.createServer(app);
  console.log("✅ HTTP enabled for production");
}

// NEW CODE - Better Socket.IO configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(",") 
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"], // Allow both transports
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  console.log("   Transport:", socket.conn.transport.name);
  console.log("   User-Agent:", socket.handshake.headers["user-agent"]);

  // Phone registers itself
  socket.on("registerDevice", ({ deviceId }) => {
    if (!deviceId) return;
    console.log("📱 Device registered:", deviceId);
    socket.join(`device:${deviceId}`);
    
    // Send confirmation back to device
    socket.emit("registered", { deviceId, socketId: socket.id });
  });

  // Controller sends a command to device
  socket.on("sendCommand", ({ deviceId, command }) => {
    if (!deviceId || !command) return;
    console.log("📨 Command to", deviceId, ":", command);
    
    // Send to the device
    io.to(`device:${deviceId}`).emit("command", command);
    
    // Send acknowledgment back to controller
    socket.emit("commandSent", { deviceId, command, timestamp: Date.now() });
  });
  
  // Device sends status update
  socket.on("deviceStatus", (status) => {
    console.log("📊 Device status:", socket.id, status);
    // Broadcast to all controllers if needed
    socket.broadcast.emit("deviceStatus", { ...status, socketId: socket.id });
  });
  
  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("error", (error) => {
    console.error("⚠️ Socket error:", socket.id, error);
  });
});



// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
 
// File Upload Handling
const upload = multer({ dest: "uploads/" });
app.use("/uploads", express.static("uploads"));
 
// Redirect root "/" to "/home"
app.get("/", (req, res) => {
  res.redirect("/home");
});
 
if (ENV === "development") {
  // Home Page
  app.get("/home", (_, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
  // Analytics Page
  app.get("/analytics", (_, res) => {
    res.sendFile(path.join(__dirname, "public", "analytics.html"));
  });
 
  // Information Page
  app.get("/information", (_, res) => {
    res.sendFile(path.join(__dirname, "public", "information.html"));
  });

  // Add this with your other routes
app.get("/diagnostic", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "diagnostic.html"));
});

app.get("/controller", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "controller.html"));
});
 
  // ✅ Unified Upload Endpoint with auto-delete
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    const result = await processUpload({ file: req.file });
    res.json(result);
  });
 
  // GET /history?page=1&limit=10
 
  app.get("/api/history", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await getHistory({ page, limit });
      res.json(result);
    } catch (err) {
      console.error("❌ Failed to fetch history:", err.message);
      res
        .status(500)
        .json({ error: "Failed to fetch classification history." });
    }
  });
 
  // Add the API route
  app.get("/api/summary", async (req, res) => {
    const result = await getDiseaseSummary();
    res.json(result);
  });
 
  app.get("/api/disease-info", async (req, res) => {
    try {
      const info = await getDiseaseInfo();
      res.json(info);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
 
// Clean uploads folder on startup
const uploadsPath = path.join(__dirname, "uploads");
 
if (fs.existsSync(uploadsPath)) {
  fs.readdirSync(uploadsPath).forEach((file) => {
    const filePath = path.join(uploadsPath, file);
    try {
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`🗑 Deleted: ${filePath}`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to delete ${filePath}:`, err.message);
    }
  });
} else {
  fs.mkdirSync(uploadsPath);
  console.log("📂 Created missing uploads/ directory");
}
 
// Start Server
server.listen(PORT, () => {
  console.log(
    `🚀 Server running at http${
      server instanceof https.Server ? "s" : ""
    }://localhost:${PORT}`
  );
});