"use client";

import { useState } from "react";
import type { CandidatePost } from "@/types";
import { CandidateCard } from "./candidate-card";

interface Props {
  candidates: CandidatePost[];
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

/**
 * サーバーサイドプロキシ経由で動画をキャッシュ
 * ブラウザのCORS制限を回避するため、サーバーが代わりにダウンロード
 */
async function cacheVideoViaProxy(
  candidate: CandidatePost
): Promise<string | null> {
  const videoUrl = candidate.item.sample_video_url;
  if (!videoUrl || candidate.item.cached_video_url) {
    return candidate.item.cached_video_url || null;
  }

  try {
    console.log(`[cacheVideo] Requesting server proxy for: ${videoUrl}`);
    const res = await fetch("/api/proxy-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: candidate.item.id,
        external_id: candidate.item.external_id,
        video_url: videoUrl,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn(`[cacheVideo] Proxy failed (${res.status}):`, errorData);
      return null;
    }

    const data = await res.json();
    console.log(`[cacheVideo] Cached: ${data.cached_video_url} (${data.size} bytes)`);
    return data.cached_video_url;
  } catch (error) {
    console.warn(`[cacheVideo] Error: ${String(error)}`);
    return null;
  }
}

export function CandidateList({ candidates: initial }: Props) {
  const [candidates, setCandidates] = useState(initial);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [cachingVideoId, setCachingVideoId] = useState<string | null>(null);
  const [postingStatus, setPostingStatus] = useState<{id: string; message: string; type: "info" | "success" | "error"} | null>(null);

  const filtered =
    filter === "all" ? candidates : candidates.filter((c) => c.status === filter);

  const counts = {
    all: candidates.length,
    pending: candidates.filter((c) => c.status === "pending").length,
    approved: candidates.filter((c) => c.status === "approved").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
  };

  async function handleAction(
    id: string,
    action: "approved" | "rejected" | "regenerate_requested",
    options?: {
      post_mode?: "A" | "B";
      custom_body_text?: string;
      schedule_mode?: "now" | "custom" | "ai";
      scheduled_at?: string;
    }
  ) {
    // Update UI immediately
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: action } : c))
    );

    try {
      // 承認時: まず動画をブラウザ経由でキャッシュ
      if (action === "approved") {
        const candidate = candidates.find((c) => c.id === id);
        if (candidate?.item.sample_video_url && !candidate.item.cached_video_url) {
          setCachingVideoId(id);
          setPostingStatus({ id, message: "動画をキャッシュ中...", type: "info" });
          try {
            const cachedUrl = await cacheVideoViaProxy(candidate);
            if (cachedUrl) {
              console.log("[approve] Video cached:", cachedUrl);
            } else {
              console.warn("[approve] Video cache failed, continuing without cache");
            }
          } finally {
            setCachingVideoId(null);
          }
        }
      }

      // Persist status to DB
      setPostingStatus((prev) => prev?.id === id ? { id, message: "ステータス更新中...", type: "info" } : prev);
      const statusRes = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error("[approve] Status update failed:", errText);
        setPostingStatus({ id, message: `ステータス更新失敗: ${errText}`, type: "error" });
        return;
      }

      // If approved, create a scheduled post
      if (action === "approved") {
        const candidate = candidates.find((c) => c.id === id);
        const variant = candidate?.variants.find((v) => v.is_selected) || candidate?.variants[0];
        if (candidate) {
          // バリアントがない場合、custom_body_textが必須
          if (!variant && !options?.custom_body_text) {
            setPostingStatus({ id, message: "投稿テキストを入力してください（AI生成がないため）", type: "error" });
            // ステータスを元に戻す
            setCandidates((prev) =>
              prev.map((c) => (c.id === id ? { ...c, status: "pending" } : c))
            );
            return;
          }

          // 投稿時間の決定
          let scheduledAt: string;
          const scheduleMode = options?.schedule_mode || "now";

          if (scheduleMode === "now") {
            scheduledAt = new Date().toISOString();
          } else if (scheduleMode === "custom" && options?.scheduled_at) {
            scheduledAt = options.scheduled_at;
          } else {
            scheduledAt = candidate.recommended_time
              ? new Date(
                  new Date().toDateString() + " " + candidate.recommended_time
                ).toISOString()
              : new Date(Date.now() + 3600000).toISOString();
          }

          setPostingStatus({ id, message: "スケジュール登録中...", type: "info" });
          const schedRes = await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidate_id: id,
              account_id: candidate.account_id,
              variant_id: variant?.id,
              scheduled_at: scheduledAt,
              post_mode: options?.post_mode || "A",
              custom_body_text: options?.custom_body_text,
            }),
          });

          if (!schedRes.ok) {
            const errText = await schedRes.text();
            console.error("[approve] Schedule failed:", errText);
            setPostingStatus({ id, message: `スケジュール登録失敗: ${errText}`, type: "error" });
            return;
          }

          const schedData = await schedRes.json();
          const scheduledPostId = schedData.scheduled_post?.id;
          console.log("[approve] Scheduled:", scheduledPostId);

          if (scheduleMode === "now" && scheduledPostId) {
            setPostingStatus({ id, message: "Xに投稿中...（動画アップロード含む、最大2分）", type: "info" });
            try {
              const postRes = await fetch("/api/post-now", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduled_post_id: scheduledPostId }),
              });
              const result = await postRes.json();
              console.log("[post] Result:", JSON.stringify(result, null, 2));
              if (result.posted > 0) {
                const mediaInfo = result.media_debug?.final_media_id ? " (動画付き)" : " (テキストのみ)";
                setPostingStatus({ id, message: `投稿成功!${mediaInfo} (${result.external_post_id})`, type: "success" });
              } else {
                setPostingStatus({ id, message: `投稿失敗: ${result.error || "不明なエラー"}`, type: "error" });
                console.error("[post] media_debug:", JSON.stringify(result.media_debug, null, 2));
              }
            } catch (postErr) {
              console.error("[post] Exception:", postErr);
              setPostingStatus({ id, message: `投稿エラー: ${String(postErr)}`, type: "error" });
            }
          } else if (scheduleMode === "now" && !scheduledPostId) {
            setPostingStatus({ id, message: "スケジュールIDが取得できませんでした", type: "error" });
          } else {
            setPostingStatus({ id, message: "投稿をスケジュールしました", type: "success" });
          }
        }

        // 採用後: 候補リストを更新
        try {
          const refreshRes = await fetch("/api/candidates");
          if (refreshRes.ok) {
            const { candidates: allCandidates } = await refreshRes.json();
            if (allCandidates) {
              setCandidates(allCandidates);
            }
          }
        } catch (err) {
          console.warn("Failed to refresh candidates:", err);
        }
      }
    } catch (error) {
      console.error("[approve] Unexpected error:", error);
      setPostingStatus({ id, message: `エラー: ${String(error)}`, type: "error" });
    }
  }

  const filters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: `すべて (${counts.all})` },
    { key: "pending", label: `承認待ち (${counts.pending})` },
    { key: "approved", label: `採用済み (${counts.approved})` },
    { key: "rejected", label: `却下 (${counts.rejected})` },
  ];

  return (
    <div className="space-y-4">
      {/* 投稿ステータス通知 */}
      {postingStatus && (
        <div
          className={`p-3 rounded-md text-sm flex items-center justify-between ${
            postingStatus.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : postingStatus.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <span>{postingStatus.message}</span>
          <button
            onClick={() => setPostingStatus(null)}
            className="ml-2 text-xs opacity-60 hover:opacity-100"
          >
            x
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onAction={handleAction}
            isCachingVideo={cachingVideoId === candidate.id}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          該当する候補はありません
        </div>
      )}
    </div>
  );
}
