"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function CarouselScroller({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLUListElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const animationOffset = useRef(0);
  const rafId = useRef<number>(0);
  const speed = 0.5; // pixels per frame

  // Auto-scroll via requestAnimationFrame
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isHovered) return;

    const tick = () => {
      animationOffset.current += speed;
      const inner = innerRef.current;
      if (inner) {
        const totalWidth = inner.scrollWidth / 3; // we triple the items
        if (animationOffset.current >= totalWidth) {
          animationOffset.current -= totalWidth;
        }
        container.scrollLeft = animationOffset.current;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [isHovered]);

  // Sync offset when hover ends so auto-scroll resumes from current position
  const handleMouseEnter = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      animationOffset.current = container.scrollLeft;
    }
    setIsDragging(false);
    setIsHovered(false);
  }, []);

  // Drag to scroll
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartX.current = containerRef.current?.scrollLeft ?? 0;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragStartX.current;
      containerRef.current.scrollLeft = scrollStartX.current - dx;
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    cancelAnimationFrame(rafId.current);
    setIsHovered(true);
    dragStartX.current = e.touches[0]!.clientX;
    scrollStartX.current = containerRef.current?.scrollLeft ?? 0;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const dx = e.touches[0]!.clientX - dragStartX.current;
      containerRef.current.scrollLeft = scrollStartX.current - dx;
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      animationOffset.current = container.scrollLeft;
    }
    setIsDragging(false);
    // Resume auto-scroll after a short delay
    setTimeout(() => setIsHovered(false), 2000);
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto scrollbar-hide"
      style={{
        cursor: isDragging ? "grabbing" : isHovered ? "grab" : "default",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ul
        ref={innerRef}
        className="flex w-max gap-3 px-4 sm:gap-4"
        style={{ userSelect: "none" }}
      >
        {children}
      </ul>
    </div>
  );
}
