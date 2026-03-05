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
    // Auth guard: check session cookie (middleware also checks, this is a fallback)
    const session = getClientSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
    setTickets(getTicketBalance());
    const iv = setInterval(() => setTickets(getTicketBalance()), 1000);
    return () => clearInterval(iv);
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
