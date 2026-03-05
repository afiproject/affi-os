"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg min-h-screen p-6">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-4 text-xl font-bold">利用規約</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>最終更新日: 2024年12月1日</p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第1条（目的）</h2>
          <p className="mt-1">本規約は、SLOTY（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第2条（定義）</h2>
          <p className="mt-1">「ユーザー」とは本サービスに登録した全ての利用者を指します。「スロット」とは時間枠の売買単位を指します。「チケット」とはサービス内通貨を指します。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第3条（登録）</h2>
          <p className="mt-1">本サービスの利用にはアカウント登録が必要です。虚偽情報での登録は禁止されます。18歳未満の方は保護者の同意が必要です。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第4条（本人確認）</h2>
          <p className="mt-1">対面モードの利用には本人確認（eKYC）が必要です。提出された身分証明書は厳重に管理され、目的外使用は行いません。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第5条（禁止事項）</h2>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            <li>外部連絡先の交換（LINE、電話番号等）</li>
            <li>違法行為、ハラスメント、差別的言動</li>
            <li>営利目的の勧誘・宣伝</li>
            <li>他者のなりすまし</li>
            <li>システムへの不正アクセス</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第6条（チケット・決済）</h2>
          <p className="mt-1">チケットは本サービス内でのみ有効です。購入後の返金は原則として行いません。ただし、相手方の都合によるキャンセル時は規定に基づき返金します。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第7条（免責事項）</h2>
          <p className="mt-1">本サービスはユーザー間のマッチングを支援するものであり、ユーザー間のトラブルについて一切の責任を負いません。サービスの中断・停止による損害についても免責とします。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>第8条（規約変更）</h2>
          <p className="mt-1">本規約は予告なく変更される場合があります。変更後も本サービスを利用した場合は、変更後の規約に同意したものとみなします。</p>
        </section>

        <p className="text-xs pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          以上
        </p>
      </div>
    </div>
  );
}
