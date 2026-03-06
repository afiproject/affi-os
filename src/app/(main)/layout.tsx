"use client";

import BottomNav from "@/components/shared/BottomNav";
import SwipeNav from "@/components/shared/SwipeNav";
import { getTicketBalance } from "@/lib/demo-store";
import { getClientSession, clearSessionCookie } from "@/lib/session";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [tickets, setTickets] = useState(18);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // AUTH_DISABLED: 認証チェックを無効化、セッションなしでもアプリ表示
    let session = getClientSession();
    if (!session) {
      const { setSessionCookie } = require("@/lib/session");
      setSessionCookie({
        userId: "guest-user",
        email: "guest@sloty.app",
        role: "DEMO" as const,
        profileComplete: true,
      });
    }
    setAuthChecked(true);
    setTickets(getTicketBalance());
    const iv = setInterval(() => setTickets(getTicketBalance()), 1000);
    return () => clearInterval(iv);
    /* AUTH_DISABLED: 以下は認証有効時のコード（復活時に差し替え）
    const session = getClientSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
    setTickets(getTicketBalance());
    const iv = setInterval(() => setTickets(getTicketBalance()), 1000);
    return () => clearInterval(iv);
    AUTH_DISABLED */
  }, [router]);

  if (!authChecked) return null;

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      <SwipeNav>
        {children}
      </SwipeNav>
      <BottomNav />
    </div>
  );
}
