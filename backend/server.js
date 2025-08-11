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
// Store active rooms with their metadata
const activeRooms = new Map();

// socket events
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Create a new room
  socket.on("create-room", ({ roomCode, userId }) => {
    try {
      // Check if room already exists
      if (activeRooms.has(roomCode)) {
        socket.emit("room-created", { 
          success: false, 
          error: "Room code already exists. Please try again." 
        });
        return;
      }

      // Create new room
      const newRoom = {
        roomCode,
        createdBy: userId,
        createdAt: new Date(),
        participants: [socket.id],
        maxParticipants: 10 // You can adjust this limit
      };

      activeRooms.set(roomCode, newRoom);
      
      // Initialize room state for whiteboard
      roomStates.set(roomCode, {
        history: []
      });

      // Join the room
      socket.join(roomCode);
      
      console.log(`🏠 Room created: ${roomCode} by user ${userId}`);
      
      socket.emit("room-created", { 
        success: true, 
        roomCode,
        room: newRoom
      });
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("room-created", { 
        success: false, 
        error: "Failed to create room. Please try again." 
      });
    }
  });

  // Join an existing room
  socket.on("join-room", ({ roomCode }) => {
    try {
      const room = activeRooms.get(roomCode);
      
      if (!room) {
        socket.emit("room-joined", { 
          success: false, 
          error: "Room not found. Please check the code." 
        });
        return;
      }

      // Check if room is full
      if (room.participants.length >= room.maxParticipants) {
        socket.emit("room-joined", { 
          success: false, 
          error: "Room is full. Please try another room." 
        });
        return;
      }

      // Add user to room participants
      if (!room.participants.includes(socket.id)) {
        room.participants.push(socket.id);
      }

      // Join the room
      socket.join(roomCode);
      
      console.log(`👥 User ${socket.id} joined room: ${roomCode}`);
      
      // Notify other users in the room
      socket.to(roomCode).emit("user-joined", { 
        userId: socket.id, 
        roomCode,
        participantCount: room.participants.length
      });
      
      socket.emit("room-joined", { 
        success: true, 
        roomCode,
        room,
        participantCount: room.participants.length
      });
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("room-joined", { 
        success: false, 
        error: "Failed to join room. Please try again." 
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

  // Handle manual room leaving
  socket.on("leave-room", ({ roomCode }) => {
    try {
      const room = activeRooms.get(roomCode);
      if (room) {
        const participantIndex = room.participants.indexOf(socket.id);
        if (participantIndex > -1) {
          room.participants.splice(participantIndex, 1);
          
          // Notify other users
          socket.to(roomCode).emit("user-left", { 
            userId: socket.id, 
            roomCode,
            participantCount: room.participants.length
          });
          
          // If room is empty, clean it up after a delay
          if (room.participants.length === 0) {
            setTimeout(() => {
              if (activeRooms.get(roomCode)?.participants.length === 0) {
                activeRooms.delete(roomCode);
                roomStates.delete(roomCode);
                console.log(`🧹 Cleaned up empty room: ${roomCode}`);
              }
            }, 300000); // 5 minutes delay
          }
          
          console.log(`👋 User ${socket.id} manually left room: ${roomCode}`);
        }
      }
    } catch (error) {
      console.error("Error handling manual room leave:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
    
    // Remove user from all rooms they were in
    for (const [roomCode, room] of activeRooms.entries()) {
      const participantIndex = room.participants.indexOf(socket.id);
      if (participantIndex > -1) {
        room.participants.splice(participantIndex, 1);
        
        // Notify other users
        socket.to(roomCode).emit("user-left", { 
          userId: socket.id, 
          roomCode,
          participantCount: room.participants.length
        });
        
        // If room is empty, clean it up after a delay
        if (room.participants.length === 0) {
          setTimeout(() => {
            if (activeRooms.get(roomCode)?.participants.length === 0) {
              activeRooms.delete(roomCode);
              roomStates.delete(roomCode);
              console.log(`🧹 Cleaned up empty room: ${roomCode}`);
            }
          }, 300000); // 5 minutes delay
        }
        
        break; // User can only be in one room at a time
      }
    }
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