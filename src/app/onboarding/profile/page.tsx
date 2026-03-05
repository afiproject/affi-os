"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingProfile, saveOnboardingProfile, getOnboardingProfileForUser, saveOnboardingProfileForUser, markProfileComplete } from "@/lib/demo-store";
import type { OnboardingProfile } from "@/lib/demo-store";
import { updateSessionProfile, getClientSession } from "@/lib/session";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const INTEREST_OPTIONS = [
  "カフェ巡り","読書","映画","音楽","ゲーム","旅行","料理","スポーツ",
  "アート","写真","プログラミング","ビジネス","語学","ヨガ","キャンプ",
  "ファッション","グルメ","ペット","DIY","ダンス",
];

const HIRAGANA_RE = /^[\u3040-\u309F\u3000\s\u30FC]+$/;
const KATAKANA_RE = /^[\u30A0-\u30FF\u3000\s\u30FC]+$/;

export default function OnboardingProfilePage() {
  const router = useRouter();
  const session = getClientSession();
  const userId = session?.userId || session?.email || "";
  // Load user-specific profile first, fallback to global
  const userProfile = userId ? getOnboardingProfileForUser(userId) : null;
  const existing = (userProfile && userProfile.displayName) ? userProfile : getOnboardingProfile();

  const [form, setForm] = useState<OnboardingProfile>({
    displayName: existing.displayName || "",
    nameKanji: existing.nameKanji || "",
    nameHiragana: existing.nameHiragana || "",
    nameKatakana: existing.nameKatakana || "",
    isForeigner: existing.isForeigner || false,
    birthdate: existing.birthdate || "",
    gender: existing.gender || "",
    area: existing.area || "",
    job: existing.job || "",
    interests: existing.interests || [],
    bio: existing.bio || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof OnboardingProfile, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleInterest(tag: string) {
    const current = form.interests;
    if (current.includes(tag)) {
      update("interests", current.filter((t) => t !== tag));
    } else if (current.length < 5) {
      update("interests", [...current, tag]);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.displayName.trim()) errs.displayName = "表示名を入力してください";
    if (!form.nameKanji.trim()) errs.nameKanji = "本名（漢字）を入力してください";

    if (!form.nameHiragana.trim()) {
      errs.nameHiragana = "ふりがなを入力してください";
    } else if (!HIRAGANA_RE.test(form.nameHiragana)) {
      errs.nameHiragana = "ひらがなのみで入力してください";
    }

    if (form.isForeigner) {
      if (!form.nameKatakana.trim()) {
        errs.nameKatakana = "カタカナ名を入力してください";
      } else if (!KATAKANA_RE.test(form.nameKatakana)) {
        errs.nameKatakana = "カタカナのみで入力してください";
      }
    } else if (form.nameKatakana && !KATAKANA_RE.test(form.nameKatakana)) {
      errs.nameKatakana = "カタカナのみで入力してください";
    }

    if (!form.birthdate) {
      errs.birthdate = "生年月日を入力してください";
    } else if (new Date(form.birthdate) > new Date()) {
      errs.birthdate = "未来の日付は入力できません";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    // Save per-user onboarding profile
    if (userId) {
      saveOnboardingProfileForUser(userId, form);
    }
    saveOnboardingProfile(form);
    // Mark profile complete in AuthUser record (persists across sessions)
    if (session?.email) {
      markProfileComplete(session.email);
    }
    // Update session cookie to mark profile as complete
    updateSessionProfile(true);
    // Go to KYC onboarding
    router.replace("/onboarding/kyc");
  }

  return (
    <div className="p-4 pb-8">
      <h1
        className="text-center text-3xl font-extrabold tracking-wide"
        style={{
          background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 45%, #F3A7C6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        SLOTY
      </h1>
      <p className="mt-1 text-center text-xs" style={{ color: "var(--muted)" }}>
        プロフィールを設定しましょう
      </p>

      <div className="mt-6 space-y-4">
        {/* Display Name */}
        <Field label="ニックネーム（公開表示名）" required error={errors.displayName}>
          <input
            type="text"
            className="input"
            placeholder="例: たろう"
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
            他のユーザーに表示される名前です（本名とは別）
          </p>
        </Field>

        {/* Foreigner check */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isForeigner}
            onChange={(e) => update("isForeigner", e.target.checked)}
          />
          <span className="text-xs">外国籍の方はこちらにチェック</span>
        </label>

        {/* Name Kanji */}
        <Field label={form.isForeigner ? "氏名（パスポート表記）" : "本名（漢字）"} required error={errors.nameKanji}>
          <input
            type="text"
            className="input"
            placeholder={form.isForeigner ? "例: John Smith" : "例: 田中 太郎"}
            value={form.nameKanji}
            onChange={(e) => update("nameKanji", e.target.value)}
          />
        </Field>

        {/* Name Hiragana */}
        {!form.isForeigner && (
          <Field label="ふりがな（ひらがな）" required error={errors.nameHiragana}>
            <input
              type="text"
              className="input"
              placeholder="例: たなか たろう"
              value={form.nameHiragana}
              onChange={(e) => update("nameHiragana", e.target.value)}
            />
          </Field>
        )}

        {/* Name Katakana */}
        <Field
          label={form.isForeigner ? "カタカナ名" : "カタカナ名（任意）"}
          required={form.isForeigner}
          error={errors.nameKatakana}
        >
          <input
            type="text"
            className="input"
            placeholder="例: タナカ タロウ"
            value={form.nameKatakana}
            onChange={(e) => update("nameKatakana", e.target.value)}
          />
        </Field>

        {/* Birthdate */}
        <Field label="生年月日" required error={errors.birthdate}>
          <input
            type="date"
            className="input"
            value={form.birthdate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => update("birthdate", e.target.value)}
          />
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
            管理用です。他のユーザーには表示されません。
          </p>
        </Field>

        {/* Divider */}
        <div
          className="pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            以下は任意ですが、入力するとマッチしやすくなります
          </p>
        </div>

        {/* Gender */}
        <Field label="性別">
          <div className="flex gap-2">
            {["男性", "女性", "その他", "回答しない"].map((g) => (
              <button
                key={g}
                onClick={() => update("gender", form.gender === g ? "" : g)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: form.gender === g ? "var(--accent-soft)" : "var(--bg)",
                  color: form.gender === g ? "var(--accent)" : "var(--muted)",
                  border: `1px solid ${form.gender === g ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

        {/* Area */}
        <Field label="居住エリア">
          <select
            className="input text-sm"
            value={form.area}
            onChange={(e) => update("area", e.target.value)}
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        {/* Job */}
        <Field label="職業">
          <input
            type="text"
            className="input"
            placeholder="例: エンジニア"
            value={form.job}
            onChange={(e) => update("job", e.target.value)}
          />
        </Field>

        {/* Interests */}
        <Field label="趣味タグ（5つまで）">
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_OPTIONS.map((tag) => {
              const selected = form.interests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: selected ? "var(--accent-soft)" : "var(--bg)",
                    color: selected ? "var(--accent)" : "var(--muted)",
                    border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Bio */}
        <Field label="自己紹介（一言）">
          <input
            type="text"
            className="input"
            placeholder="例: よろしくお願いします！"
            maxLength={160}
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
          <p className="text-right text-[10px]" style={{ color: "var(--muted)" }}>
            {form.bio.length}/160
          </p>
        </Field>

        {/* Submit */}
        <button onClick={handleSubmit} className="btn-primary w-full text-sm !py-3 mt-2">
          プロフィールを保存して次へ
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
