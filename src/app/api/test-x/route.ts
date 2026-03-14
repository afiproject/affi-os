import { NextResponse } from "next/server";

// X API診断エンドポイント
// 1. 認証情報の確認
// 2. GET /2/users/me で認証テスト
// 3. POST /2/tweets でツイートテスト
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Step 1: 環境変数チェック
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  results.env_check = {
    X_API_KEY: apiKey ? `set (${apiKey.slice(0, 5)}...)` : "MISSING",
    X_API_SECRET: apiSecret ? `set (${apiSecret.slice(0, 5)}...)` : "MISSING",
    X_ACCESS_TOKEN: accessToken ? `set (${accessToken.slice(0, 5)}...)` : "MISSING",
    X_ACCESS_TOKEN_SECRET: accessTokenSecret ? `set (${accessTokenSecret.slice(0, 5)}...)` : "MISSING",
  };

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    results.error = "Missing credentials";
    return NextResponse.json(results);
  }

  // Step 2: GET /2/users/me で認証テスト (OAuth 2.0 Bearer Token)
  try {
    // まずBearer Tokenで試す
    const bearerRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN || ""}` },
    });
    results.bearer_test = {
      status: bearerRes.status,
      body: await bearerRes.text(),
    };
  } catch (e) {
    results.bearer_test = { error: String(e) };
  }

  // Step 3: OAuth 1.0aでユーザー情報取得テスト
  try {
    const crypto = await import("crypto");
    const url = "https://api.twitter.com/2/users/me";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    const pe = (s: string) =>
      encodeURIComponent(s).replace(/!/g, "%21").replace(/\*/g, "%2A").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");

    const paramString = Object.keys(oauthParams).sort().map((k) => `${pe(k)}=${pe(oauthParams[k])}`).join("&");
    const baseString = `GET&${pe(url)}&${pe(paramString)}`;
    const signingKey = `${pe(apiSecret)}&${pe(accessTokenSecret)}`;
    const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
    oauthParams.oauth_signature = signature;

    const headerParts = Object.keys(oauthParams).sort().map((k) => `${pe(k)}="${pe(oauthParams[k])}"`).join(", ");
    const oauthHeader = `OAuth ${headerParts}`;

    const res = await fetch(url, {
      headers: { Authorization: oauthHeader },
    });

    const body = await res.text();
    results.oauth_user_test = {
      status: res.status,
      body: body,
    };
  } catch (e) {
    results.oauth_user_test = { error: String(e) };
  }

  // Step 4: ツイート投稿テスト（テスト文を送信）
  try {
    const crypto = await import("crypto");
    const url = "https://api.twitter.com/2/tweets";
    const tweetText = `テスト投稿 ${new Date().toISOString().slice(0, 19)}`;
    const body = JSON.stringify({ text: tweetText });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    const pe = (s: string) =>
      encodeURIComponent(s).replace(/!/g, "%21").replace(/\*/g, "%2A").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");

    const paramString = Object.keys(oauthParams).sort().map((k) => `${pe(k)}=${pe(oauthParams[k])}`).join("&");
    const baseString = `POST&${pe(url)}&${pe(paramString)}`;
    const signingKey = `${pe(apiSecret)}&${pe(accessTokenSecret)}`;
    const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
    oauthParams.oauth_signature = signature;

    const headerParts = Object.keys(oauthParams).sort().map((k) => `${pe(k)}="${pe(oauthParams[k])}"`).join(", ");
    const oauthHeader = `OAuth ${headerParts}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body,
    });

    const resBody = await res.text();
    results.tweet_test = {
      status: res.status,
      attempted_text: tweetText,
      body: resBody,
    };
  } catch (e) {
    results.tweet_test = { error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
