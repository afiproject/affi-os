"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("sloty_splash_seen");
    if (seen) {
      setShow(false);
      return;
    }
    const t1 = setTimeout(() => setFade(true), 1700);
    const t2 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("sloty_splash_seen", "1");
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return <>{children}</>;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
        >
          S
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>
          SLOTY
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          時間共有マーケット
        </p>
      </div>
      <div className="absolute bottom-12">
        <div className="h-1 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-full rounded-full animate-[loading_1.8s_ease-in-out]"
            style={{ backgroundColor: "var(--accent)" }}
          />
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
