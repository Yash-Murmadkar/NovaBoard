import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { getSocket } from "../socket";

export default function RoomSelection() {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const socket = getSocket();

  const generateRoomCode = () => {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateUniqueRoomCode = () => {
    // Try to generate a unique code (max 10 attempts to avoid infinite loop)
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateRoomCode();
      // In a real app, you might want to check against existing codes
      // For now, we'll just return the generated code
      return code;
    }
    // Fallback if we somehow can't generate a unique code
    return generateRoomCode();
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const newRoomCode = generateUniqueRoomCode();
      
      // Emit create-room event to backend
      socket.emit("create-room", { 
        roomCode: newRoomCode, 
        userId: user.id, 
        username: user.name || user.email || 'Anonymous' 
      });
      
      // Wait for confirmation
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
        
        socket.once("room-created", (data) => {
          clearTimeout(timeout);
          if (data.success) {
            resolve(data);
          } else {
            reject(new Error(data.error || "Failed to create room"));
          }
        });
      });
      
      // Navigate to the new room
      navigate(`/room/${newRoomCode}`);
    } catch (err) {
      setError(err.message || "Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const trimmedCode = roomCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      setError("Please enter a room code");
      return;
    }
    
    if (trimmedCode.length !== 6) {
      setError("Room code must be exactly 6 characters");
      return;
    }
    
    // Validate room code format (only letters and numbers)
    if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
      setError("Room code must contain only letters and numbers");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Emit join-room event to backend
      socket.emit("join-room", { 
        roomCode: trimmedCode, 
        username: user.name || user.email || 'Anonymous' 
      });
      
      // Wait for confirmation
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
        
        socket.once("room-joined", (data) => {
          clearTimeout(timeout);
          if (data.success) {
            resolve(data);
          } else {
            reject(new Error(data.error || "Failed to join room"));
          }
        });
      });
      
      // Navigate to the room
      navigate(`/room/${trimmedCode}`);
    } catch (err) {
      setError(err.message || "Failed to join room. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate("/home");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-blue-600">NovaBoard</h1>
        <button
          onClick={() => navigate("/home")}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Back to Home
        </button>
      </header>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Collaborative Room
        </h2>
        <p className="text-gray-600 mt-2">
          Create a new room or join an existing one
        </p>
      </div>

      {/* Room Options */}
      <div className="max-w-md w-full space-y-6">
        {!mode ? (
          <>
            {/* Create Room Option */}
            <button
              onClick={() => setMode("create")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="text-center">
                <div className="text-3xl mb-3">🏠</div>
                <h3 className="text-xl font-semibold mb-2">Create New Room</h3>
                <p className="text-purple-100">Start a new collaborative session</p>
              </div>
            </button>

            {/* Join Room Option */}
            <button
              onClick={() => setMode("join")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="text-center">
                <div className="text-3xl mb-3">🚪</div>
                <h3 className="text-xl font-semibold mb-2">Join Existing Room</h3>
                <p className="text-blue-100">Enter a room code to join</p>
              </div>
            </button>
          </>
        ) : mode === "create" ? (
          /* Create Room Form */
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Create New Room</h3>
              <p className="text-gray-600">Generate a unique room code for others to join</p>
            </div>
            
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Creating Room..." : "Create Room"}
            </button>
            
            <button
              onClick={() => setMode(null)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-semibold mt-3 transition-colors"
            >
              Back
            </button>
          </div>
        ) : (
          /* Join Room Form */
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Join Room</h3>
              <p className="text-gray-600">Enter the 6-character room code</p>
            </div>
            
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code (e.g., ABC123)"
              maxLength={6}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center text-lg font-mono tracking-widest"
            />
            
            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !roomCode.trim()}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors mb-3 ${
                isLoading || !roomCode.trim() ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Joining..." : "Join Room"}
            </button>
            
            <button
              onClick={() => setMode(null)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
