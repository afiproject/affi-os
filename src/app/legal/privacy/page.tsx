"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg min-h-screen p-6">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-4 text-xl font-bold">プライバシーポリシー</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>最終更新日: 2024年12月1日</p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>1. 収集する情報</h2>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            <li>アカウント情報（メールアドレス、表示名）</li>
            <li>本人確認書類（身分証画像、セルフィー）</li>
            <li>位置情報（すれ違い機能利用時、100m単位に丸め処理）</li>
            <li>利用ログ（予約履歴、チャット履歴）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>2. 利用目的</h2>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            <li>サービスの提供・運営</li>
            <li>本人確認・安全性の確保</li>
            <li>すれ違いマッチング機能の実現</li>
            <li>不正利用の防止</li>
            <li>サービス改善のための分析</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>3. 位置情報の取り扱い</h2>
          <p className="mt-1">位置情報は100m単位に丸め処理を行い、正確な位置は保存しません。距離表示はレンジ形式（例: 200〜300m）で表示し、ストーキング防止に配慮しています。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>4. 本人確認書類の管理</h2>
          <p className="mt-1">提出された身分証明書は暗号化して保存し、審査完了後は速やかに削除します。管理者の閲覧にはウォーターマークが付与され、ダウンロードは禁止されています。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>5. 第三者提供</h2>
          <p className="mt-1">法令に基づく場合を除き、個人情報を第三者に提供することはありません。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>6. データの保持期間</h2>
          <p className="mt-1">アカウント情報はサービス利用中保持します。退会後は30日以内に削除します。チャットログは通報対応のため90日間保持します。</p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>7. お問い合わせ</h2>
          <p className="mt-1">個人情報に関するお問い合わせは <a href="/support" style={{ color: "var(--accent)", textDecoration: "underline" }}>お問い合わせフォーム</a> よりご連絡ください。</p>
        </section>
      </div>
    </div>
  );
}
