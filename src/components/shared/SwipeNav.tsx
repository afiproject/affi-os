"use client";

import { useRef, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const TAB_ORDER = ["/market", "/nearby", "/messages", "/calendar", "/square", "/profile"];

type Props = {
  children: ReactNode;
};

export default function SwipeNav({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  // Disable swipe on map views or form inputs
  const isMapActive = typeof window !== "undefined" && document.querySelector(".leaflet-container:hover") !== null;

  const currentIndex = TAB_ORDER.findIndex(t => pathname.startsWith(t));

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Skip if touch is on input/select/textarea or map
    const target = e.target as HTMLElement;
    if (target.closest("input, select, textarea, .leaflet-container, [data-no-swipe]")) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;

    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    // Must be horizontal swipe (|dx| > 60, |dy| < |dx|)
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

    if (currentIndex < 0) return;

    if (dx < -60 && currentIndex < TAB_ORDER.length - 1) {
      router.push(TAB_ORDER[currentIndex + 1]);
    } else if (dx > 60 && currentIndex > 0) {
      router.push(TAB_ORDER[currentIndex - 1]);
    }
  }, [currentIndex, router]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: "100%" }}
    >
      {children}
    </div>
  );
}
