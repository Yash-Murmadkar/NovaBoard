// src/pages/Room.jsx
import React, { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SharedWhiteboard from "../components/SharedWhiteboard";
import { AuthContext } from "../AuthContext";

export default function Room() {
  const { id } = useParams(); // route /room/:id
  const roomId = id || "lobby";
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `Room ${roomId} • NovaBoard`;
  }, [roomId]);

  // guard: redirect guests to /home (you already show modal there, but this is extra safety)
  useEffect(() => {
    if (!user) {
      // optionally redirect or let them see page but disable features
      // navigate("/home");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white shadow flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">NovaBoard — Room {roomId}</h1>
          <p className="text-sm text-gray-500">Share this code with others to join: <strong>{roomId}</strong></p>
        </div>
      </header>

      <main className="flex-1 p-4">
        <SharedWhiteboard roomId={roomId} disabled={!user} />
      </main>
    </div>
  );
}
