// src/pages/Room.jsx
import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SharedWhiteboard from "../components/SharedWhiteboard";
import { AuthContext } from "../AuthContext";
import { getSocket } from "../socket";
import Toast from "../components/Toast";

export default function Room() {
  const { id } = useParams(); // route /room/:id
  const roomCode = id || "lobby";
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "info" });
  const socket = getSocket();

  useEffect(() => {
    document.title = `Room ${roomCode} • NovaBoard`;
  }, [roomCode]);

  // guard: redirect guests to /home (you already show modal there, but this is extra safety)
  useEffect(() => {
    if (!user) {
      navigate("/home");
      return;
    }
  }, [user, navigate]);

  // Handle room joining and socket events
  useEffect(() => {
    if (!user || !socket) return;

    // Join the room
    socket.emit("join-room", { roomCode });

    // Listen for room join confirmation
    const handleRoomJoined = (data) => {
      if (data.success && data.roomCode === roomCode) {
        setIsConnected(true);
        setParticipantCount(data.participantCount);
      }
    };

    // Listen for user joined events
    const handleUserJoined = (data) => {
      if (data.roomCode === roomCode) {
        setParticipantCount(data.participantCount);
      }
    };

    // Listen for user left events
    const handleUserLeft = (data) => {
      if (data.roomCode === roomCode) {
        setParticipantCount(data.participantCount);
      }
    };

    socket.on("room-joined", handleRoomJoined);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    // Cleanup
    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
    };
  }, [user, socket, roomCode]);

  const handleLeaveRoom = () => {
    // Emit leave-room event to backend
    if (socket && isConnected) {
      socket.emit("leave-room", { roomCode });
    }
    navigate("/home");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
      
      <header className="p-4 bg-white shadow flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">NovaBoard — Room {roomCode}</h1>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-500">
              Share this code with others to join:
            </p>
            <div className="flex items-center gap-2">
              <strong className="font-mono text-lg bg-gray-100 px-2 py-1 rounded">{roomCode}</strong>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  setToast({ isVisible: true, message: "Room code copied!", type: "success" });
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
                title="Copy room code"
              >
                📋
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Participants: {participantCount} {isConnected ? "🟢" : "🟡"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLeaveRoom}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Leave Room
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <SharedWhiteboard roomId={roomCode} disabled={!user || !isConnected} />
      </main>
    </div>
  );
}
