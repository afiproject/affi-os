"use client";

import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">設定</h1>

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
