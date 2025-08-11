import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

// example protected route
app.get("/api/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

// create HTTP server for both API & WebSockets
const server = http.createServer(app);

// socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*", // change to your frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Store room states for whiteboard synchronization
const roomStates = new Map();

// socket events
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Join a whiteboard room
  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined room: ${roomId}`);
    
    // Initialize room state if it doesn't exist
    if (!roomStates.has(roomId)) {
      roomStates.set(roomId, {
        history: []
      });
    }
  });

  // Request initial sync state
  socket.on("requestSync", ({ roomId }) => {
    const roomState = roomStates.get(roomId);
    if (roomState) {
      socket.emit("syncState", roomState);
    }
  });

  // Whiteboard drawing events
  socket.on("startDraw", (data) => {
    // Add socket ID to data for identification
    data.userId = socket.id;
    socket.to(data.roomId).emit("startDraw", data);
  });

  socket.on("draw", (data) => {
    // Add socket ID to data for identification
    data.userId = socket.id;
    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("endDraw", (data) => {
    // Add socket ID to data for identification
    data.userId = socket.id;
    socket.to(data.roomId).emit("endDraw", data);
  });

  // Whiteboard action events
  socket.on("clear", (data) => {
    // Add socket ID to data for identification
    data.userId = socket.id;
    
    // Clear room state
    const roomState = roomStates.get(data.roomId);
    if (roomState) {
      roomState.history = [];
    }
    
    socket.to(data.roomId).emit("clear", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// connect DB and start server
const PORT = process.env.PORT || 5000;

// For whiteboard functionality, we don't need MongoDB
// Only connect to DB if MONGO_URI is provided
if (process.env.MONGO_URI) {
  connectDB(process.env.MONGO_URI).then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
} else {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}