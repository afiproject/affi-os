"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientSession } from "@/lib/session";

export default function SplashPage() {
  const router = useRouter();
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const session = getClientSession();
    if (!session) {
      // Middleware should redirect, but fallback
      router.replace("/login");
      return;
    }

    const t1 = setTimeout(() => setFade(true), 1700);
    const t2 = setTimeout(() => {
      if (!session.profileComplete && session.role !== "DEMO") {
        router.replace("/onboarding/profile");
      } else {
        router.replace("/home");
      }
    }, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
      style={{
        background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 45%, #F3A7C6 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <h1
          className="text-5xl font-extrabold tracking-wide text-white"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
        >
          SLOTY
        </h1>
        <p
          className="text-base font-medium text-white/90"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.1)" }}
        >
          〜あなたの時間を価値に〜
        </p>
      </div>

      <div className="absolute bottom-16">
        <div className="h-1 w-28 overflow-hidden rounded-full bg-white/30">
          <div className="h-full rounded-full bg-white animate-[splash_1.8s_ease-in-out]" />
        </div>
      </div>

      <style>{`
        @keyframes splash {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
