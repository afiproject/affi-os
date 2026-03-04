"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/market", label: "マーケット", icon: "🏪" },
  { href: "/square", label: "広場", icon: "🏛️" },
  { href: "/friends", label: "フレンド", icon: "👥" },
  { href: "/profile", label: "プロフィール", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center py-2 text-xs transition-colors ${
                isActive
                  ? "text-[var(--color-accent)] font-semibold"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
