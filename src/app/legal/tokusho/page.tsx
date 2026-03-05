"use client";

import { useRouter } from "next/navigation";

export default function TokushoPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg min-h-screen p-6">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-4 text-xl font-bold">特定商取引法に基づく表示</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>最終更新日: 2024年12月1日</p>

      <div className="mt-6 space-y-4">
        {[
          ["販売事業者", "SLOTY運営事務局"],
          ["所在地", "お問い合わせ時に開示いたします"],
          ["代表者", "お問い合わせ時に開示いたします"],
          ["連絡先", "support@sloty.app（お問い合わせフォームをご利用ください）"],
          ["販売価格", "各チケットパック・サブスクリプションの表示価格に準じます（税込）"],
          ["支払方法", "クレジットカード（Stripe経由）"],
          ["支払時期", "購入時に即時決済"],
          ["商品の引渡時期", "決済完了後、即時にチケットが付与されます"],
          ["返品・キャンセル", "デジタルコンテンツの性質上、購入後の返品・返金は原則として行いません。ただし、相手方の都合によるキャンセル時は規定に基づき返金します。"],
          ["動作環境", "最新版のChrome、Safari、Edge等のモダンブラウザ"],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-3 text-sm py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="shrink-0 w-28 font-medium">{label}</span>
            <span style={{ color: "var(--muted)" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
