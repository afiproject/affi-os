"use client";

import BottomNav from "@/components/shared/BottomNav";
import SwipeNav from "@/components/shared/SwipeNav";
import { getTicketBalance, isLoggedIn } from "@/lib/demo-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  const [tickets, setTickets] = useState(18);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Auth guard: redirect to login if not authenticated (demo mode skips)
    if (!isDemo && !isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
    setTickets(getTicketBalance());
    const iv = setInterval(() => setTickets(getTicketBalance()), 1000);
    return () => clearInterval(iv);
  }, [isDemo, router]);

  // In production mode, wait for auth check
  if (!isDemo && !authChecked) return null;

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      <SwipeNav>
        {children}
      </SwipeNav>
      <BottomNav />
    </div>
  );
}
