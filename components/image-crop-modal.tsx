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
  const rafRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Multi-pointer tracking for pinch-to-zoom and single-finger drag
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragAnchorRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);
  const pinchStartOffsetRef = useRef({ x: 0, y: 0 });

  const CANVAS_SIZE = 300;
  const OUTPUT_SIZE = 400;
  const RADIUS = CANVAS_SIZE / 2;

  // CSS display size → canvas internal pixel scale
  const getDisplayScale = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return 1;
    return c.getBoundingClientRect().width / CANVAS_SIZE;
  }, []);

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
    const maxOx = Math.max(0, (drawW - CANVAS_SIZE) / 2);
    const maxOy = Math.max(0, (drawH - CANVAS_SIZE) / 2);
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

  // Draw
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

    // Shade outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Circle outline
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
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

  // Convert clientX/Y to canvas-internal coordinates
  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const scale = getDisplayScale();
    return { x: clientX / scale, y: clientY / scale };
  }, [getDisplayScale]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = toCanvas(e.clientX, e.clientY);
    pointersRef.current.set(e.pointerId, pos);

    if (pointersRef.current.size === 1) {
      isDraggingRef.current = true;
      dragAnchorRef.current = {
        x: pos.x - offsetRef.current.x,
        y: pos.y - offsetRef.current.y,
      };
    } else if (pointersRef.current.size === 2) {
      isDraggingRef.current = false;
      const pts = Array.from(pointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      pinchStartZoomRef.current = zoomRef.current;
      pinchStartOffsetRef.current = { ...offsetRef.current };
    }
  }, [toCanvas]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const pos = toCanvas(e.clientX, e.clientY);
    pointersRef.current.set(e.pointerId, pos);

    if (pointersRef.current.size === 2 && pinchStartDistRef.current !== null) {
      // Pinch-to-zoom
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      const minZ = getMinZoom();
      const maxZ = minZ * 4;
      const newZoom = Math.max(minZ, Math.min(maxZ,
        pinchStartZoomRef.current * (dist / pinchStartDistRef.current)
      ));
      zoomRef.current = newZoom;
      offsetRef.current = clampOffset(
        pinchStartOffsetRef.current.x,
        pinchStartOffsetRef.current.y,
        newZoom,
      );
      setZoom(newZoom);
      scheduleDraw();
    } else if (pointersRef.current.size === 1 && isDraggingRef.current) {
      // Single-finger drag
      offsetRef.current = clampOffset(
        pos.x - dragAnchorRef.current.x,
        pos.y - dragAnchorRef.current.y,
        zoomRef.current,
      );
      scheduleDraw();
    }
  }, [toCanvas, getMinZoom, clampOffset, scheduleDraw]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      isDraggingRef.current = false;
    } else if (pointersRef.current.size === 1) {
      // Went from 2 fingers back to 1 — reset drag anchor to avoid position jump
      isDraggingRef.current = true;
      const remaining = Array.from(pointersRef.current.values())[0];
      dragAnchorRef.current = {
        x: remaining!.x - offsetRef.current.x,
        y: remaining!.y - offsetRef.current.y,
      };
    }
  }, []);

  // Scroll wheel zoom (desktop)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const minZ = getMinZoom();
    const maxZ = minZ * 4;
    const newZoom = Math.max(minZ, Math.min(maxZ, zoomRef.current - e.deltaY * 0.002));
    zoomRef.current = newZoom;
    offsetRef.current = clampOffset(offsetRef.current.x, offsetRef.current.y, newZoom);
    setZoom(newZoom);
    scheduleDraw();
  }, [getMinZoom, clampOffset, scheduleDraw]);

  const applyZoom = useCallback((newZoom: number) => {
    zoomRef.current = newZoom;
    offsetRef.current = clampOffset(offsetRef.current.x, offsetRef.current.y, newZoom);
    setZoom(newZoom);
    scheduleDraw();
  }, [clampOffset, scheduleDraw]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyZoom(parseFloat(e.target.value));
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

  // Lock scroll while open
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, []);

  const minZoom = getMinZoom();
  const maxZoom = minZoom * 4;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-brand-dark-gold/20 bg-brand-dark px-5 pb-6 pt-5">
        <h3 className="mb-1 text-center font-heading text-lg text-brand-gold">
          adjust photo
        </h3>
        <p className="mb-4 text-center text-xs text-brand-grey">
          drag to reposition · pinch or slider to zoom
        </p>

        {/* Canvas — responsive width, fills the card */}
        <div className="mb-5 flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="cursor-grab rounded-full active:cursor-grabbing"
            style={{ width: "min(72vw, 280px)", height: "min(72vw, 280px)", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Zoom controls */}
        <div className="mb-1 flex items-center gap-2 px-1">
          <button
            type="button"
            aria-label="Zoom out"
            onPointerDown={(e) => { e.preventDefault(); applyZoom(Math.max(minZoom, zoom - (maxZoom - minZoom) * 0.05)); }}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-brand-grey active:text-brand-gold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.001}
            value={zoom}
            onChange={handleZoomChange}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-brand-dark-gold/30 accent-brand-gold [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-gold"
          />
          <button
            type="button"
            aria-label="Zoom in"
            onPointerDown={(e) => { e.preventDefault(); applyZoom(Math.min(maxZoom, zoom + (maxZoom - minZoom) * 0.05)); }}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-brand-grey active:text-brand-gold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </button>
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
            className="flex-1 rounded-lg border border-brand-dark-gold/30 px-4 py-3 text-sm text-brand-grey transition-colors hover:border-brand-gold/50 hover:text-brand-gold"
          >
            cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-brand-gold px-4 py-3 text-sm font-medium text-brand-dark transition-colors hover:opacity-90"
          >
            save photo
          </button>
        </div>
      </div>
    </div>
  );
}
