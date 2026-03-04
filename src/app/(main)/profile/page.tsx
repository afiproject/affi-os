"use client";

import Link from "next/link";
import { DEMO_USER, DEMO_TICKET_LEDGER, IS_DEMO } from "@/lib/demo-data";

export default function ProfilePage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">設定</h1>

      {IS_DEMO && (
        <div className="mt-4 card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {DEMO_USER.displayName[0]}
            </div>
            <div>
              <p className="font-semibold">{DEMO_USER.displayName}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{DEMO_USER.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
            <span className="text-sm">🎫 チケット残高</span>
            <span className="text-lg font-bold text-[var(--color-accent)]">{DEMO_USER.ticketBalance}枚</span>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* アカウント */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            アカウント
          </h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="プロフィール編集" href="/profile/edit" />
            <SettingsRow label="本人確認" href="/profile/verify" />
          </div>
        </section>

        {/* 表示 */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            表示
          </h2>
          <div className="mt-2 space-y-1">
            <SettingsToggle label="ダークモード" />
          </div>
        </section>

        {/* 通知 */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            通知
          </h2>
          <div className="mt-2 space-y-1">
            <SettingsToggle label="Push通知" defaultOn />
            <SettingsToggle label="予約リマインド" defaultOn />
            <SettingsToggle label="依頼通知" defaultOn />
          </div>
        </section>

        {/* チケット */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            チケット
          </h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="チケット購入" href="/profile/tickets" />
            <SettingsRow label="利用履歴" href="/profile/tickets/history" />
          </div>
          {IS_DEMO && (
            <div className="mt-2 card p-3 space-y-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">最近の履歴（デモ）</p>
              {DEMO_TICKET_LEDGER.slice(0, 4).map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{entry.reason}</span>
                  <span className={entry.delta > 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* その他 */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            その他
          </h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="利用規約" href="/terms" />
            <SettingsRow label="プライバシーポリシー" href="/privacy" />
            <SettingsRow label="ヘルプ" href="/help" />
          </div>
        </section>

        {/* ログアウト */}
        <div className="space-y-2">
          <button className="w-full rounded-xl border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-secondary)]">
            ログアウト
          </button>
          <button className="w-full rounded-xl p-3 text-sm text-red-500">
            アカウント削除
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl p-3 text-sm transition-colors hover:bg-[var(--color-card)]"
    >
      <span>{label}</span>
      <span className="text-[var(--color-text-secondary)]">→</span>
    </Link>
  );
}

function SettingsToggle({
  label,
  defaultOn = false,
}: {
  label: string;
  defaultOn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl p-3 text-sm">
      <span>{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          defaultChecked={defaultOn}
          className="peer sr-only"
        />
        <div className="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent)] peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}
