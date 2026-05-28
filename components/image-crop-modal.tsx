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
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const CANVAS_SIZE = 300;
  const OUTPUT_SIZE = 400;
  const RADIUS = CANVAS_SIZE / 2;

  const getMinZoom = useCallback(() => {
    const img = imageRef.current;
    if (!img) return 1;
    return Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
  }, []);

  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    const img = imageRef.current;
    if (!img) return { x: ox, y: oy };
    const drawW = img.width * z;
    const drawH = img.height * z;
    const maxOx = (drawW - CANVAS_SIZE) / 2;
    const maxOy = (drawH - CANVAS_SIZE) / 2;
    return {
      x: Math.max(-maxOx, Math.min(maxOx, ox)),
      y: Math.max(-maxOy, Math.min(maxOy, oy)),
    };
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const minZ = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      zoomRef.current = minZ;
      setZoom(minZ);
      offsetRef.current = { x: 0, y: 0 };
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw to canvas using requestAnimationFrame
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const z = zoomRef.current;
    const off = offsetRef.current;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const drawW = img.width * z;
    const drawH = img.height * z;
    const drawX = (CANVAS_SIZE - drawW) / 2 + off.x;
    const drawY = (CANVAS_SIZE - drawH) / 2 + off.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    const isLight = typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-color-mode") === "light";

    // Shade outside circle
    ctx.save();
    ctx.fillStyle = isLight ? "rgba(200, 190, 170, 0.55)" : "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Circle boundary guide
    ctx.strokeStyle = isLight ? "rgba(110, 82, 20, 0.35)" : "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS - 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    if (imageLoaded) scheduleDraw();
  }, [imageLoaded, scheduleDraw, zoom]);

  // Pointer handlers — use refs for smooth dragging without re-renders
  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const newOffset = clampOffset(
      e.clientX - dragStartRef.current.x,
      e.clientY - dragStartRef.current.y,
      zoomRef.current,
    );
    offsetRef.current = newOffset;
    scheduleDraw();
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  // Scroll zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const minZ = getMinZoom();
    const maxZ = minZ * 4;
    const newZoom = Math.max(minZ, Math.min(maxZ, zoomRef.current - e.deltaY * 0.002));
    zoomRef.current = newZoom;
    offsetRef.current = clampOffset(offsetRef.current.x, offsetRef.current.y, newZoom);
    setZoom(newZoom);
    scheduleDraw();
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    zoomRef.current = newZoom;
    offsetRef.current = clampOffset(offsetRef.current.x, offsetRef.current.y, newZoom);
    setZoom(newZoom);
    scheduleDraw();
  };

  const handleReset = () => {
    const minZ = getMinZoom();
    zoomRef.current = minZ;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(minZ);
    scheduleDraw();
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
    const z = zoomRef.current;
    const off = offsetRef.current;
    const drawW = img.width * z * scale;
    const drawH = img.height * z * scale;
    const drawX = (OUTPUT_SIZE - drawW) / 2 + off.x * scale;
    const drawY = (OUTPUT_SIZE - drawH) / 2 + off.y * scale;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    onSave(out.toDataURL("image/jpeg", 0.85));
  };

  const minZoom = getMinZoom();
  const maxZoom = minZoom * 4;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[rgba(20,16,12,0.78)]">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
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
            className="flex-1 rounded border border-brand-dark-gold/30 px-4 py-2.5 text-sm text-brand-grey transition-colors hover:border-brand-gold/50 hover:bg-brand-gold/10 hover:text-brand-gold"
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
    </div>
  );
}
