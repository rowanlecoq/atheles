"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ImageCropModalProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  imageSrc,
  onSave,
  onCancel,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const CANVAS_SIZE = 280;
  const OUTPUT_SIZE = 256;
  const RADIUS = CANVAS_SIZE / 2;

  // Calculate minimum zoom to fully cover the circle
  const getMinZoom = useCallback(() => {
    const img = imageRef.current;
    if (!img) return 1;
    return Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
  }, []);

  // Clamp offset so image always covers the circle
  const clampOffset = useCallback(
    (ox: number, oy: number, z: number) => {
      const img = imageRef.current;
      if (!img) return { x: ox, y: oy };

      const drawW = img.width * z;
      const drawH = img.height * z;

      // Image draw position: centered + offset
      // drawX = (CANVAS_SIZE - drawW) / 2 + ox
      // For the circle to be fully covered:
      // drawX <= 0 and drawX + drawW >= CANVAS_SIZE
      const maxOx = (drawW - CANVAS_SIZE) / 2;
      const maxOy = (drawH - CANVAS_SIZE) / 2;

      return {
        x: Math.max(-maxOx, Math.min(maxOx, ox)),
        y: Math.max(-maxOy, Math.min(maxOy, oy)),
      };
    },
    [],
  );

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      const minZ = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      setZoom(minZ);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const drawW = img.width * zoom;
    const drawH = img.height * zoom;
    const drawX = (CANVAS_SIZE - drawW) / 2 + offset.x;
    const drawY = (CANVAS_SIZE - drawH) / 2 + offset.y;

    // Clip to circle and draw
    ctx.save();
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Darken outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "rgba(181, 149, 72, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, offset]);

  useEffect(() => {
    if (imageLoaded) draw();
  }, [imageLoaded, draw]);

  // Pointer handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const newOffset = clampOffset(
      e.clientX - dragStart.x,
      e.clientY - dragStart.y,
      zoom,
    );
    setOffset(newOffset);
  };

  const handlePointerUp = () => setDragging(false);

  // Scroll zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const minZ = getMinZoom();
    const maxZ = minZ * 4;
    const newZoom = Math.max(minZ, Math.min(maxZ, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
    setOffset(clampOffset(offset.x, offset.y, newZoom));
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    setOffset(clampOffset(offset.x, offset.y, newZoom));
  };

  const handleReset = () => {
    const minZ = getMinZoom();
    setZoom(minZ);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = () => {
    const img = imageRef.current;
    if (!img) return;

    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    const scale = OUTPUT_SIZE / CANVAS_SIZE;
    const drawW = img.width * zoom * scale;
    const drawH = img.height * zoom * scale;
    const drawX = (OUTPUT_SIZE - drawW) / 2 + offset.x * scale;
    const drawY = (OUTPUT_SIZE - drawH) / 2 + offset.y * scale;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    onSave(out.toDataURL("image/jpeg", 0.85));
  };

  const minZoom = getMinZoom();
  const maxZoom = minZoom * 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
        <h3 className="mb-2 text-center font-heading text-lg text-brand-gold">
          adjust photo
        </h3>
        <p className="mb-4 text-center text-xs text-brand-grey">
          drag to reposition, scroll or use slider to zoom
        </p>

        {/* Canvas */}
        <div className="mb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="cursor-grab rounded-full active:cursor-grabbing"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Zoom slider */}
        <div className="mb-2 flex items-center gap-3 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 flex-none text-brand-grey">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.001}
            value={zoom}
            onChange={handleZoomChange}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-brand-dark-gold/30 accent-brand-gold [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-gold"
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 flex-none text-brand-grey">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="11" y1="8" x2="11" y2="14" />
          </svg>
        </div>

        {/* Reset */}
        <div className="mb-5 text-center">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-brand-grey transition-colors hover:text-brand-gold"
          >
            reset position
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-brand-dark-gold/30 px-4 py-2.5 text-sm text-brand-grey transition-colors hover:border-brand-gold/50 hover:text-white"
          >
            cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded bg-brand-gold px-4 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light-gold"
          >
            save photo
          </button>
        </div>
      </div>
    </div>
  );
}
