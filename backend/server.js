require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./db");

const userRoutes    = require("./userRoutes");
const authRoutes    = require("./authRoutes");
const messageRoutes = require("./messageRoutes");
const { initSocket } = require("./socket");

// Connect to DB
connectDB();

const app    = express();
const server = http.createServer(app);

// CORS
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser requests (Postman, etc.) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/users",    userRoutes);
app.use("/api/auth",     authRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/", (_req, res) => res.json({ status: "ok", message: "🚀 NotifyX backend running" }));

// 404 handler
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("SERVER ERROR:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// Socket.IO
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
initSocket(io);

// Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ NotifyX backend running on port ${PORT}`));
