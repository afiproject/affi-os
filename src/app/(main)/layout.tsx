"use client";

import BottomNav from "@/components/shared/BottomNav";
import SwipeNav from "@/components/shared/SwipeNav";
import { getTicketBalance } from "@/lib/demo-store";
import { useEffect, useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  const [tickets, setTickets] = useState(18);

  useEffect(() => {
    setTickets(getTicketBalance());
    const iv = setInterval(() => setTickets(getTicketBalance()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      {isDemo && (
        <div className="flex items-center justify-between px-4 py-1.5 text-xs font-medium"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
          <span>DEMO MODE</span>
          <span>🎫 {tickets}枚</span>
        </div>
      )}
      <SwipeNav>
        {children}
      </SwipeNav>
      <BottomNav />
    </div>
  );
}
