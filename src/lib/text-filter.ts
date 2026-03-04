/**
 * テキストフィルタ: URL、電話番号、LINE ID等を検知・除去する
 * 外部誘導を抑制する目的
 */

// URL検知パターン
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

// 電話番号検知パターン（日本の電話番号）
const PHONE_PATTERN =
  /(?:0[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{3,4})|(?:\+81[0-9\-]{9,12})/g;

// LINE ID検知パターン
const LINE_PATTERN = /(?:line[\s:：]?(?:id)?[\s:：]?\s*[@＠]?[a-zA-Z0-9._-]+)|(?:@[a-zA-Z0-9._-]{4,})/gi;

// SNS アカウント検知
const SNS_PATTERN =
  /(?:instagram|twitter|x\.com|tiktok|facebook|discord)[\s:：/]*[@＠]?[a-zA-Z0-9._-]+/gi;

/**
 * テキストに外部誘導パターンが含まれているかチェック
 */
export function containsExternalContact(text: string): {
  hasViolation: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (URL_PATTERN.test(text)) violations.push("URL");
  if (PHONE_PATTERN.test(text)) violations.push("電話番号");
  if (LINE_PATTERN.test(text)) violations.push("LINE ID");
  if (SNS_PATTERN.test(text)) violations.push("SNSアカウント");

  return {
    hasViolation: violations.length > 0,
    violations,
  };
}

/**
 * テキストから外部誘導パターンを除去して返す
 */
export function sanitizeText(text: string): string {
  return text
    .replace(URL_PATTERN, "[削除済み]")
    .replace(PHONE_PATTERN, "[削除済み]")
    .replace(LINE_PATTERN, "[削除済み]")
    .replace(SNS_PATTERN, "[削除済み]");
}
