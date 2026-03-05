"use client";

import { useState, useEffect } from "react";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // セッション内で1回だけ表示
    if (sessionStorage.getItem("sloty_splash_shown")) {
      setShow(false);
      return;
    }
    const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
    const hideTimer = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("sloty_splash_shown", "1");
    }, 2000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!show) return <>{children}</>;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #9b8afb 0%, #7566d5 100%)",
          opacity: fadeOut ? 0 : 1,
          transition: "opacity 0.4s ease-out",
        }}
      >
        <div style={{
          fontSize: 48,
          marginBottom: 16,
          animation: "splash-pop 0.5s ease-out",
        }}>
          🕐
        </div>
        <h1 style={{
          color: "#fff",
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 2,
          margin: 0,
          animation: "splash-pop 0.5s ease-out 0.15s both",
        }}>
          SLOTY
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 14,
          marginTop: 8,
          fontWeight: 500,
          animation: "splash-pop 0.5s ease-out 0.3s both",
        }}>
          ようこそ、時間共有マーケットへ
        </p>
      </div>
      <style>{`
        @keyframes splash-pop {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div style={{ visibility: "hidden" }}>{children}</div>
    </>
  );
}
