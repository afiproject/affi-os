"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  title?: string;
  showClose?: boolean;
};

export default function SwipeSheet({ open, onClose, children, footer, title, showClose = true }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) setOffsetY(diff);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (offsetY > 100) {
      onClose();
    }
    setOffsetY(0);
  }, [offsetY, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg rounded-t-2xl flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: "var(--card)",
          transform: `translateY(${offsetY}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 pt-3 pb-2 px-5 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
        </div>

        {/* Header */}
        {(title || showClose) && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 pb-2">
            {title && <h3 className="text-lg font-bold">{title}</h3>}
            {showClose && (
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-sm" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>×</button>
            )}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
