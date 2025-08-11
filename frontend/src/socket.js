// src/socket.js
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    // change URL if your server runs on a different port/host
    //socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000");
    socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
