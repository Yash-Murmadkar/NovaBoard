import { useRef, useState, useEffect, useCallback } from "react";

function Personal() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState("draw"); // "draw" or "erase"
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = mode === "erase" ? "#ffffff" : brushColor;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize, mode]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    saveState(); // Save state for undo
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const endDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    setUndoStack((prev) => [...prev, dataURL]);
    setRedoStack([]); // Clear redo on new action
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const lastState = undoStack.pop();
    setRedoStack((prev) => [...prev, canvas.toDataURL()]);
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const nextState = redoStack.pop();
    setUndoStack((prev) => [...prev, canvas.toDataURL()]);
    const img = new Image();
    img.src = nextState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const saveToLocal = () => {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    localStorage.setItem("savedWhiteboard", data);
    // alert("Whiteboard saved!");
    alert("Checkpoint saved!!")
  };

  const loadFromLocal = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const data = localStorage.getItem("savedWhiteboard");
    if (!data) return alert("No saved whiteboard found.");
    const img = new Image();
    img.src = data;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex flex-wrap gap-3 justify-center">
        <button onClick={() => setMode("draw")} className="bg-blue-500 px-4 py-2 text-white rounded">
          Draw
        </button>
        <button onClick={() => setMode("erase")} className="bg-yellow-600 px-4 py-2 text-white rounded">
          Erase
        </button>
        <button onClick={clearCanvas} className="bg-red-500 px-4 py-2 text-white rounded">
          Clear
        </button>
        <button onClick={undo} className="bg-gray-700 px-4 py-2 text-white rounded">
          Undo
        </button>
        <button onClick={redo} className="bg-gray-500 px-4 py-2 text-white rounded">
          Redo
        </button>
        <button onClick={downloadImage} className="bg-green-600 px-4 py-2 text-white rounded">
          Download
        </button>
        <button onClick={saveToLocal} className="bg-indigo-600 px-4 py-2 text-white rounded">
          Checkpoint
        </button>
        <button onClick={loadFromLocal} className="bg-purple-600 px-4 py-2 text-white rounded">
          Return to Checkpoint
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
        />
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
        <span>{brushSize}px</span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        className="border rounded-lg bg-white shadow"
        style={{ touchAction: "none", maxWidth: "90vw", maxHeight: "75vh" }}
      />
    </div>
  );
}

export default Personal;
