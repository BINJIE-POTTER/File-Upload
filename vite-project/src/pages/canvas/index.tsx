import { useRef, useState } from "react";

const CanvasPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(5);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Canvas Page</h1>
      
      <div className="mb-4 flex gap-4 items-center">
        <label className="flex items-center gap-2">
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 cursor-pointer"
          />
        </label>
        <label className="flex items-center gap-2">
          Width:
          <input
            type="range"
            min="1"
            max="50"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-32"
          />
          <span className="w-8 text-sm">{width}px</span>
        </label>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-300 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default CanvasPage;

