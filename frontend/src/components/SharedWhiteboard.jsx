// src/components/SharedWhiteboard.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { getSocket } from "../socket";

export default function SharedWhiteboard({ roomId, disabled = false, isConnected = false }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);
  const drawCounterRef = useRef(0);
  // Track remote user drawing state to avoid connecting paths across users
  const remoteUserStateRef = useRef(new Map()); // userId -> { isDrawing: boolean, lastX: number, lastY: number, mode: string, color: string, size: number }
  

  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState("draw"); // "draw" or "erase"


  // Initialize canvas and socket
  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth * 0.9;
      canvas.height = window.innerHeight * 0.75;
      canvas.style.background = "#ffffff";

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctxRef.current = ctx;
    };

    const initSocket = () => {
      socketRef.current = getSocket();
      
      const socket = socketRef.current;
      
      // Only listen for drawing events, connection status is managed by parent
      socket.on("startDraw", handleRemoteStart);
      socket.on("draw", handleRemoteDraw);
      socket.on("endDraw", handleRemoteEnd);
      socket.on("clear", handleRemoteClear);

      

      // Initial sync is handled by the Room component

      return () => {
        socket.off("startDraw", handleRemoteStart);
        socket.off("draw", handleRemoteDraw);
        socket.off("endDraw", handleRemoteEnd);
        socket.off("clear", handleRemoteClear);
        
      };
    };

    initCanvas();
    const cleanupSocket = initSocket();

    const handleResize = () => {
      const canvas = canvasRef.current;
      const currentImage = canvas.toDataURL();
      canvas.width = window.innerWidth * 0.9;
      canvas.height = window.innerHeight * 0.75;
      
      const img = new Image();
      img.onload = () => {
        ctxRef.current.drawImage(img, 0, 0);
      };
      img.src = currentImage;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cleanupSocket?.();
      window.removeEventListener('resize', handleResize);
      // Clear remote state on unmount
      remoteUserStateRef.current.clear();
    };
  }, [roomId]);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = mode === "erase" ? "#ffffff" : brushColor;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize, mode]);

  // Ensure a path exists for a given remote user before drawing
  const ensureRemotePathStarted = useCallback((userId, xNorm, yNorm, color, size, remoteMode) => {
    const canvas = canvasRef.current;
    const state = remoteUserStateRef.current.get(userId);
    if (!state || !state.isDrawing) {
      // Begin a new path for this user
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.moveTo(xNorm * canvas.width, yNorm * canvas.height);
      ctx.strokeStyle = remoteMode === "erase" ? "#ffffff" : (color || "#000000");
      ctx.lineWidth = size || 4;
      ctx.globalCompositeOperation = remoteMode === "erase" ? "destination-out" : "source-over";
      remoteUserStateRef.current.set(userId, {
        isDrawing: true,
        lastX: xNorm,
        lastY: yNorm,
        color: color || "#000000",
        size: size || 4,
        mode: remoteMode || "draw"
      });
    }
  }, []);

  // Remote operation handlers - handle per-user paths safely
  const handleRemoteStart = useCallback(({ x, y, color, size, mode: remoteMode, userId, clientTs, serverTs }) => {
    if (userId === socketRef.current?.id) return; // ignore own events
    ensureRemotePathStarted(userId, x, y, color, size, remoteMode);
    if (typeof serverTs === "number") {
      const downstream = Date.now() - serverTs;
      console.log(`Downstream latency (startDraw from ${userId.slice(0,8)}): ${downstream}ms`);
    } else if (typeof clientTs === "number") {
      const approx = performance.now() - clientTs;
      console.log(`Approx E2E (unsynced clocks) startDraw: ${Math.round(approx)}ms`);
    }
  }, [ensureRemotePathStarted]);

  const handleRemoteDraw = useCallback(({ x, y, userId, clientTs, serverTs }) => {
    if (userId === socketRef.current?.id) return; // ignore own events
    const canvas = canvasRef.current;
    const state = remoteUserStateRef.current.get(userId);
    // If we missed startDraw due to network/throttle, ensure path is started
    if (!state) {
      ensureRemotePathStarted(userId, x, y, undefined, undefined, "draw");
      // continue with draw so first segment renders
    }
    const ctx = ctxRef.current;
    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();
    state.lastX = x;
    state.lastY = y;
    if (typeof serverTs === "number") {
      const downstream = Date.now() - serverTs;
      console.log(`Downstream latency (draw from ${userId.slice(0,8)}): ${downstream}ms`);
    } else if (typeof clientTs === "number") {
      const approx = performance.now() - clientTs;
      console.log(`Approx E2E (unsynced clocks) draw: ${Math.round(approx)}ms`);
    }
  }, [ensureRemotePathStarted]);

  const handleRemoteEnd = useCallback(({ userId, serverTs, clientTs }) => {
    if (userId === socketRef.current?.id) return; // ignore own events
    const ctx = ctxRef.current;
    const state = remoteUserStateRef.current.get(userId);
    if (state && state.isDrawing) {
      ctx.closePath();
      ctx.globalCompositeOperation = "source-over";
      remoteUserStateRef.current.delete(userId);
    }
    if (typeof serverTs === "number") {
      const downstream = Date.now() - serverTs;
      console.log(`Downstream latency (endDraw from ${userId.slice(0,8)}): ${downstream}ms`);
    } else if (typeof clientTs === "number") {
      const approx = performance.now() - clientTs;
      console.log(`Approx E2E (unsynced clocks) endDraw: ${Math.round(approx)}ms`);
    }
  }, []);

  const handleRemoteClear = useCallback(({ userId }) => {
    if (userId === socketRef.current?.id) return; // ignore own events
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Reset all remote states as canvas is cleared
    remoteUserStateRef.current.clear();
  }, []);

  // Local drawing functions - these work independently and emit to others
  const startDrawing = useCallback((e) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Reset draw counter for new drawing session
    drawCounterRef.current = 0;

    // Start drawing locally first
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = mode === "erase" ? "#ffffff" : brushColor;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    setIsDrawing(true);

    // Emit start immediately to reduce race with remote 'draw'
    socketRef.current.emit("startDraw", {
      roomId,
      x: x / canvas.width,
      y: y / canvas.height,
      color: brushColor,
      size: brushSize,
      mode: mode,
      userId: socketRef.current.id,
      clientTs: performance.now()
    });
  }, [disabled, brushColor, brushSize, mode, roomId]);

  const draw = useCallback((e) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw locally first
    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit to other users less frequently to avoid overwhelming the network
    drawCounterRef.current++;
    
    if (drawCounterRef.current % 3 === 0) {
      socketRef.current.emit("draw", {
        roomId,
        x: x / canvas.width,
        y: y / canvas.height,
        userId: socketRef.current.id,
        clientTs: performance.now()
      });
    }
  }, [isDrawing, disabled, roomId]);

  const endDrawing = useCallback(() => {
    if (disabled) return;
    
    const ctx = ctxRef.current;
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    setIsDrawing(false);

    // Emit to other users
    socketRef.current.emit("endDraw", { 
      roomId, 
      userId: socketRef.current.id,
      clientTs: performance.now() 
    });
  }, [disabled, roomId]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    // Clear locally first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Emit to other users
    socketRef.current.emit("clear", { 
      roomId, 
      userId: socketRef.current.id 
    });
    // Reset remote states
    remoteUserStateRef.current.clear();
  }, [roomId]);

  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      
      
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 justify-center">
        <button 
          onClick={() => setMode("draw")} 
          className={`px-4 py-2 text-white rounded transition-colors ${
            mode === "draw" ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Draw
        </button>
        <button 
          onClick={() => setMode("erase")} 
          className={`px-4 py-2 text-white rounded transition-colors ${
            mode === "erase" ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          Erase
        </button>
        <button 
          onClick={clearCanvas} 
          className="bg-red-500 hover:bg-red-600 px-4 py-2 text-white rounded transition-colors"
        >
          Clear
        </button>
        <button 
          onClick={downloadImage} 
          className="bg-green-600 hover:bg-green-700 px-4 py-2 text-white rounded transition-colors"
        >
          Download
        </button>
      </div>

      {/* Color and Size Controls */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-10 h-10 rounded border cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600 min-w-[3rem]">{brushSize}px</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        className="border rounded-lg bg-white shadow-lg cursor-crosshair"
        style={{ touchAction: "none", maxWidth: "90vw", maxHeight: "75vh" }}
      />

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600 text-center max-w-2xl">
        <p><strong>Instructions:</strong></p>
        <p>• <strong>Draw:</strong> Click and drag to draw</p>
        <p>• <strong>Erase:</strong> Switch to erase mode to remove drawings</p>
        <p>• <strong>Color & Size:</strong> Use the controls above to customize your drawing</p>
        <p>• <strong>Real-time:</strong> All drawing is synchronized across all users in the room</p>
      </div>
    </div>
  );
}