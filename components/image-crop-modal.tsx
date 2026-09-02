"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ImageCropModalProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspect?: "square" | "16:9";
}

export default function ImageCropModal({
  imageSrc,
  onSave,
  onCancel,
  aspect = "square",
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragAnchorRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);
  const pinchStartOffsetRef = useRef({ x: 0, y: 0 });

  const CANVAS_W = 320;
  const CANVAS_H = aspect === "16:9" ? 180 : 320;
  const OUTPUT_W = aspect === "16:9" ? 1920 : 800;
  const OUTPUT_H = aspect === "16:9" ? 1080 : 800;

  const getDisplayScale = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return 1;
    return c.getBoundingClientRect().width / CANVAS_W;
  }, [CANVAS_W]);

  const getMinZoom = useCallback(() => {
    const img = imageRef.current;
    if (!img) return 1;
    return Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
  }, [CANVAS_W, CANVAS_H]);

  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    const img = imageRef.current;
    if (!img) return { x: ox, y: oy };
    const drawW = img.width * z;
    const drawH = img.height * z;
    const maxOx = Math.max(0, (drawW - CANVAS_W) / 2);
    const maxOy = Math.max(0, (drawH - CANVAS_H) / 2);
    return {
      x: Math.max(-maxOx, Math.min(maxOx, ox)),
      y: Math.max(-maxOy, Math.min(maxOy, oy)),
    };
  }, [CANVAS_W, CANVAS_H]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      const minZ = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
      zoomRef.current = minZ;
      setZoom(minZ);
      offsetRef.current = { x: 0, y: 0 };
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc, CANVAS_W, CANVAS_H]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const z = zoomRef.current;
    const off = offsetRef.current;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const drawW = img.width * z;
    const drawH = img.height * z;
    const drawX = (CANVAS_W - drawW) / 2 + off.x;
    const drawY = (CANVAS_H - drawH) / 2 + off.y;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    if (aspect === "square") {
      // Circular crop guide with dim outside
      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;
      const r = Math.min(CANVAS_W, CANVAS_H) / 2 - 2;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.rect(0, 0, CANVAS_W, CANVAS_H);
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Corner bracket guides
      const g = 12;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, g); ctx.lineTo(0, 0); ctx.lineTo(g, 0);
      ctx.moveTo(CANVAS_W - g, 0); ctx.lineTo(CANVAS_W, 0); ctx.lineTo(CANVAS_W, g);
      ctx.moveTo(0, CANVAS_H - g); ctx.lineTo(0, CANVAS_H); ctx.lineTo(g, CANVAS_H);
      ctx.moveTo(CANVAS_W - g, CANVAS_H); ctx.lineTo(CANVAS_W, CANVAS_H); ctx.lineTo(CANVAS_W, CANVAS_H - g);
      ctx.stroke();
    }
  }, [CANVAS_W, CANVAS_H, aspect]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    if (imageLoaded) scheduleDraw();
  }, [imageLoaded, scheduleDraw, zoom]);

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
    if (pointersRef.current.size < 2) pinchStartDistRef.current = null;
    if (pointersRef.current.size === 0) {
      isDraggingRef.current = false;
    } else if (pointersRef.current.size === 1) {
      isDraggingRef.current = true;
      const remaining = Array.from(pointersRef.current.values())[0];
      dragAnchorRef.current = {
        x: remaining!.x - offsetRef.current.x,
        y: remaining!.y - offsetRef.current.y,
      };
    }
  }, []);

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
    out.width = OUTPUT_W;
    out.height = OUTPUT_H;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    const scaleX = OUTPUT_W / CANVAS_W;
    const scaleY = OUTPUT_H / CANVAS_H;
    const z = zoomRef.current;
    const off = offsetRef.current;
    const drawW = img.width * z * scaleX;
    const drawH = img.height * z * scaleY;
    const drawX = (OUTPUT_W - drawW) / 2 + off.x * scaleX;
    const drawY = (OUTPUT_H - drawH) / 2 + off.y * scaleY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    onSave(out.toDataURL("image/jpeg", 0.85));
  };

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

        <div className="mb-5">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full cursor-grab rounded-lg active:cursor-grabbing"
            style={{ display: "block", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

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

        <div className="mb-5 text-center">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-brand-grey transition-colors hover:text-brand-gold"
          >
            reset position
          </button>
        </div>

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
