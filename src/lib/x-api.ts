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

export interface TweetOptions {
  media_id?: string;
  reply_to_tweet_id?: string;
}

export async function postTweet(text: string, options?: TweetOptions): Promise<TweetResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "X API credentials not configured" };
  }

  const url = "https://api.twitter.com/2/tweets";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { text };

  if (options?.media_id) {
    payload.media = { media_ids: [options.media_id] };
  }

  if (options?.reply_to_tweet_id) {
    payload.reply = { in_reply_to_tweet_id: options.reply_to_tweet_id };
  }

  const body = JSON.stringify(payload);
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

// ==========================================
// Media Upload (v1.1 chunked upload)
// ==========================================

const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export interface MediaUploadResult {
  success: boolean;
  media_id?: string;
  error?: string;
}

/**
 * 動画ファイルをX APIにアップロード（chunked upload）
 * @param videoBuffer 動画のバイナリデータ
 * @param mimeType MIMEタイプ（default: video/mp4）
 */
export async function uploadVideo(
  videoBuffer: Buffer,
  mimeType: string = "video/mp4"
): Promise<MediaUploadResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "X API credentials not configured" };
  }

  try {
    // Step 1: INIT
    const initResult = await mediaUploadInit(config, videoBuffer.length, mimeType);
    if (!initResult.success || !initResult.media_id) {
      return { success: false, error: initResult.error || "INIT failed" };
    }
    const mediaId = initResult.media_id;

    // Step 2: APPEND (chunked)
    for (let i = 0; i < videoBuffer.length; i += CHUNK_SIZE) {
      const chunk = videoBuffer.subarray(i, Math.min(i + CHUNK_SIZE, videoBuffer.length));
      const segmentIndex = Math.floor(i / CHUNK_SIZE);
      const appendResult = await mediaUploadAppend(config, mediaId, chunk, segmentIndex);
      if (!appendResult.success) {
        return { success: false, error: appendResult.error || `APPEND segment ${segmentIndex} failed` };
      }
    }

    // Step 3: FINALIZE
    const finalizeResult = await mediaUploadFinalize(config, mediaId);
    if (!finalizeResult.success) {
      return { success: false, error: finalizeResult.error || "FINALIZE failed" };
    }

    // Step 4: Check processing status (動画は非同期処理)
    if (finalizeResult.processing) {
      const statusResult = await waitForProcessing(config, mediaId);
      if (!statusResult.success) {
        return { success: false, error: statusResult.error || "Processing failed" };
      }
    }

    return { success: true, media_id: mediaId };
  } catch (error) {
    return { success: false, error: `Media upload error: ${String(error)}` };
  }
}

async function mediaUploadInit(
  config: XApiConfig,
  totalBytes: number,
  mimeType: string
): Promise<{ success: boolean; media_id?: string; error?: string }> {
  const params: Record<string, string> = {
    command: "INIT",
    total_bytes: String(totalBytes),
    media_type: mimeType,
    media_category: "tweet_video",
  };

  const authHeader = buildOAuthHeader("POST", MEDIA_UPLOAD_URL, config, params);

  const body = new URLSearchParams(params);
  const res = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: `INIT error (${res.status}): ${JSON.stringify(data)}` };
  }

  return { success: true, media_id: data.media_id_string };
}

async function mediaUploadAppend(
  config: XApiConfig,
  mediaId: string,
  chunk: Buffer,
  segmentIndex: number
): Promise<{ success: boolean; error?: string }> {
  // APPEND uses multipart/form-data — OAuth signs only the URL params
  const oauthParams: Record<string, string> = {
    command: "APPEND",
    media_id: mediaId,
    segment_index: String(segmentIndex),
  };

  const authHeader = buildOAuthHeader("POST", MEDIA_UPLOAD_URL, config, oauthParams);

  // Build multipart form
  const boundary = `----boundary${Date.now()}`;
  const parts: Buffer[] = [];

  // command field
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="command"\r\n\r\nAPPEND\r\n`));
  // media_id field
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media_id"\r\n\r\n${mediaId}\r\n`));
  // segment_index field
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="segment_index"\r\n\r\n${segmentIndex}\r\n`));
  // media_data field (binary)
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media_data"\r\n\r\n`));
  parts.push(Buffer.from(chunk.toString("base64")));
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const bodyBuffer = Buffer.concat(parts);

  const res = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuffer,
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    return { success: false, error: `APPEND error (${res.status}): ${text}` };
  }

  return { success: true };
}

async function mediaUploadFinalize(
  config: XApiConfig,
  mediaId: string
): Promise<{ success: boolean; processing?: boolean; error?: string }> {
  const params: Record<string, string> = {
    command: "FINALIZE",
    media_id: mediaId,
  };

  const authHeader = buildOAuthHeader("POST", MEDIA_UPLOAD_URL, config, params);

  const body = new URLSearchParams(params);
  const res = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: `FINALIZE error (${res.status}): ${JSON.stringify(data)}` };
  }

  // 動画の場合 processing_info が返る
  const processing = !!data.processing_info;
  return { success: true, processing };
}

async function waitForProcessing(
  config: XApiConfig,
  mediaId: string,
  maxWaitMs: number = 120000
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const params: Record<string, string> = {
      command: "STATUS",
      media_id: mediaId,
    };

    const url = `${MEDIA_UPLOAD_URL}?command=STATUS&media_id=${mediaId}`;
    const authHeader = buildOAuthHeader("GET", MEDIA_UPLOAD_URL, config, params);

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      return { success: false, error: `STATUS check failed (${res.status})` };
    }

    const data = await res.json();
    const state = data.processing_info?.state;

    if (state === "succeeded") {
      return { success: true };
    }
    if (state === "failed") {
      const errorMsg = data.processing_info?.error?.message || "Video processing failed";
      return { success: false, error: errorMsg };
    }

    // Wait before next check
    const waitSecs = data.processing_info?.check_after_secs || 5;
    await new Promise((r) => setTimeout(r, waitSecs * 1000));
  }

  return { success: false, error: "Video processing timeout" };
}

/**
 * URLから動画をダウンロードしてBufferとして返す
 * FANZA CDN URLの場合、複数の品質パターンを試行する
 */
export async function downloadVideo(videoUrl: string): Promise<Buffer | null> {
  // FANZA CDN URLの場合、軽量版を優先（Vercelメモリ制限対策）
  const urls: string[] = [];
  if (videoUrl.includes("cc3001.dmm.co.jp") && videoUrl.includes("_mhb_w.mp4")) {
    urls.push(
      videoUrl.replace("_mhb_w.mp4", "_sm_w.mp4"),
      videoUrl.replace("_mhb_w.mp4", "_dmb_w.mp4"),
      videoUrl
    );
  } else {
    urls.push(videoUrl);
  }

  for (const url of urls) {
    try {
      console.log(`[downloadVideo] Trying: ${url}`);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.dmm.co.jp/",
          "Accept": "*/*",
        },
      });
      if (!res.ok) {
        console.log(`[downloadVideo] ${res.status} for ${url}`);
        continue;
      }
      const contentType = res.headers.get("content-type") || "";
      console.log(`[downloadVideo] Content-Type: ${contentType} for ${url}`);
      // video/*, application/octet-stream, またはmp4拡張子のURLならOK
      if (!contentType.includes("video") && !contentType.includes("octet-stream") && !url.includes(".mp4")) {
        console.log(`[downloadVideo] Not a video (${contentType}): ${url}`);
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      console.log(`[downloadVideo] Downloaded ${arrayBuffer.byteLength} bytes from ${url}`);
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`[downloadVideo] Error for ${url}: ${String(error)}`);
    }
  }

  console.error(`[downloadVideo] All URLs failed for ${videoUrl}`);
  return null;
}

/**
 * 画像をURLからダウンロードしてX APIにアップロード
 */
export async function uploadImageFromUrl(imageUrl: string): Promise<MediaUploadResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "X API credentials not configured" };
  }

  try {
    console.log(`[uploadImage] Downloading: ${imageUrl}`);
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return { success: false, error: `Image download failed: ${res.status}` };
    }
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    console.log(`[uploadImage] Downloaded ${arrayBuffer.byteLength} bytes`);

    // Simple image upload (not chunked)
    const params: Record<string, string> = {
      media_data: base64,
      media_category: "tweet_image",
    };
    const authHeader = buildOAuthHeader("POST", MEDIA_UPLOAD_URL, config, {
      media_category: "tweet_image",
    });

    const body = new URLSearchParams(params);
    const uploadRes = await fetch(MEDIA_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await uploadRes.json();
    if (!uploadRes.ok) {
      return { success: false, error: `Image upload error (${uploadRes.status}): ${JSON.stringify(data)}` };
    }

    console.log(`[uploadImage] Uploaded, media_id: ${data.media_id_string}`);
    return { success: true, media_id: data.media_id_string };
  } catch (error) {
    return { success: false, error: `Image upload error: ${String(error)}` };
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
