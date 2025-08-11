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
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "info" });
  const socket = getSocket();
  


  // Check socket connection status
  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        setIsConnected(true);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleConnecting = () => {
        setIsConnected(false);
      };

      const handleConnectError = () => {
        setIsConnected(false);
      };

      const handleReconnect = () => {
        setIsConnected(true);
      };

      const handleReconnectError = () => {
        setIsConnected(false);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connecting", handleConnecting);
      socket.on("connect_error", handleConnectError);
      socket.on("reconnect", handleReconnect);
      socket.on("reconnect_error", handleReconnectError);

      // Set initial connection status
      const initialStatus = socket.connected;
      setIsConnected(initialStatus);

      // If socket is not connected initially, try to connect
      if (!initialStatus && !socket.connecting) {
        socket.connect();
      }

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connecting", handleConnecting);
        socket.off("connect_error", handleConnectError);
        socket.off("reconnect", handleReconnect);
        socket.off("reconnect_error", handleReconnectError);
      };
    }
  }, [socket]);

  



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
    socket.emit("join-room", { roomCode, username: user.name || user.email || 'Anonymous' });

    // Listen for room join confirmation
    const handleRoomJoined = (data) => {
      if (data.success && data.roomCode === roomCode) {
        setParticipantCount(data.participantCount);
        setParticipants(data.participants || []);
      }
    };

    // Listen for user joined events
    const handleUserJoined = (data) => {
      if (data.roomCode === roomCode) {
        setParticipantCount(data.participantCount);
        setParticipants(data.participants || []);
        // Show toast notification
        setToast({
          isVisible: true,
          message: `${data.username} joined the room`,
          type: "success"
        });
      }
    };

    // Listen for user left events
    const handleUserLeft = (data) => {
      if (data.roomCode === roomCode) {
        setParticipantCount(data.participantCount);
        setParticipants(data.participants || []);
        // Show toast notification
        setToast({
          isVisible: true,
          message: `${data.username} left the room`,
          type: "info"
        });
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

  // Cleanup when component unmounts or user changes
  useEffect(() => {
    return () => {
      // If user is leaving the room, emit leave event
      if (socket && user) {
        try {
          socket.emit("leave-room", { roomCode });
        } catch (error) {
          // Silent fail on cleanup
        }
      }
    };
  }, [socket, user, roomCode]);

  const handleLeaveRoom = () => {
    // Emit leave-room event to backend
    if (socket) {
      try {
        socket.emit("leave-room", { roomCode });
        
        // Wait a bit for the event to be processed before navigating
        setTimeout(() => {
          navigate("/home");
        }, 100);
      } catch (error) {
        navigate("/home");
      }
    } else {
      navigate("/home");
    }
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
              Participants: {participantCount} 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${isConnected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                {isConnected ? "🟢 CONNECTED" : "🟡 CONNECTING"}
              </span>
            </p>
            {/* Participants List */}
            {participants.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Online:</p>
                <div className="flex flex-wrap gap-1">
                  {participants.map((participant, index) => (
                    <span
                      key={participant.id || index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      {participant.username}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
         <SharedWhiteboard 
           roomId={roomCode} 
           disabled={!user || !isConnected} 
           isConnected={isConnected} 
         />
       </main>
    </div>
  );
}
