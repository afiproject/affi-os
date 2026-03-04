"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/market", label: "マーケット", icon: "🏪" },
  { href: "/nearby", label: "すれ違い", icon: "📡" },
  { href: "/calendar", label: "カレンダー", icon: "📅" },
  { href: "/square", label: "広場", icon: "🏛️" },
  { href: "/profile", label: "設定", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center py-2 text-[10px] transition-colors"
              style={{ color: isActive ? "var(--accent)" : "var(--muted)", fontWeight: isActive ? 600 : 400 }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
