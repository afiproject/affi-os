// ========================================
// X (Twitter) API v2 Client
// OAuth 1.0a署名付き
// ========================================

import crypto from "crypto";

interface XApiConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function getConfig(): XApiConfig | null {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  return { apiKey, apiSecret, accessToken, accessTokenSecret };
}

// ==========================================
// OAuth 1.0a Signing
// ==========================================

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function buildOAuthHeader(
  method: string,
  url: string,
  config: XApiConfig,
  bodyParams?: Record<string, string>
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  // Combine all params for signature base
  const allParams: Record<string, string> = { ...oauthParams };
  if (bodyParams) {
    Object.assign(allParams, bodyParams);
  }

  // Sort and encode
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  // Signature base string
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;

  // Signing key
  const signingKey = `${percentEncode(config.apiSecret)}&${percentEncode(config.accessTokenSecret)}`;

  // HMAC-SHA1
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  oauthParams.oauth_signature = signature;

  // Build header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

// ==========================================
// Tweet Operations
// ==========================================

export interface TweetResult {
  success: boolean;
  tweet_id?: string;
  error?: string;
}

export async function postTweet(text: string): Promise<TweetResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "X API credentials not configured" };
  }

  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text });

  const authHeader = buildOAuthHeader("POST", url, config);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await res.json();

    if (!res.ok) {
      const errorDetail = data.detail || data.title || JSON.stringify(data);
      return { success: false, error: `X API error (${res.status}): ${errorDetail}` };
    }

    return {
      success: true,
      tweet_id: data.data?.id,
    };
  } catch (error) {
    return { success: false, error: `Network error: ${String(error)}` };
  }
}

export async function deleteTweet(tweetId: string): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  const url = `https://api.twitter.com/2/tweets/${tweetId}`;
  const authHeader = buildOAuthHeader("DELETE", url, config);

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==========================================
// Tweet Metrics (Analytics)
// ==========================================

export interface TweetMetrics {
  tweet_id: string;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  url_clicks: number;
}

export async function getTweetMetrics(tweetIds: string[]): Promise<Map<string, TweetMetrics>> {
  const config = getConfig();
  const result = new Map<string, TweetMetrics>();
  if (!config || tweetIds.length === 0) return result;

  // X API v2 supports up to 100 tweet IDs per request
  const batchSize = 100;
  for (let i = 0; i < tweetIds.length; i += batchSize) {
    const batch = tweetIds.slice(i, i + batchSize);
    const ids = batch.join(",");
    const url = `https://api.twitter.com/2/tweets?ids=${ids}&tweet.fields=public_metrics,non_public_metrics,organic_metrics`;

    const authHeader = buildOAuthHeader("GET", url.split("?")[0], config, {
      ids,
      "tweet.fields": "public_metrics,non_public_metrics,organic_metrics",
    });

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: authHeader },
      });

      if (!res.ok) continue;

      const data = await res.json();
      for (const tweet of data.data || []) {
        const pub = tweet.public_metrics || {};
        const nonPub = tweet.non_public_metrics || {};
        result.set(tweet.id, {
          tweet_id: tweet.id,
          impressions: nonPub.impression_count || pub.impression_count || 0,
          likes: pub.like_count || 0,
          retweets: pub.retweet_count || 0,
          replies: pub.reply_count || 0,
          url_clicks: nonPub.url_link_clicks || 0,
        });
      }
    } catch {
      // Skip failed batches
    }
  }

  return result;
}

export function isXApiConfigured(): boolean {
  return getConfig() !== null;
}
