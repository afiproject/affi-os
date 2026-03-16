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
          try {
            await cacheVideoViaProxy(candidate);
          } finally {
            setCachingVideoId(null);
          }
        }
      }

      // Persist status to DB
      const statusRes = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!statusRes.ok) {
        console.error("Status update failed:", await statusRes.text());
        return;
      }

      // If approved, create a scheduled post
      if (action === "approved") {
        const candidate = candidates.find((c) => c.id === id);
        const variant = candidate?.variants.find((v) => v.is_selected) || candidate?.variants[0];
        if (candidate && variant) {
          // 投稿時間の決定
          let scheduledAt: string;
          const scheduleMode = options?.schedule_mode || "now";

          if (scheduleMode === "now") {
            // 今すぐ投稿: 現在時刻を設定（すぐにcron/postで拾われる）
            scheduledAt = new Date().toISOString();
          } else if (scheduleMode === "custom" && options?.scheduled_at) {
            // 時間指定
            scheduledAt = options.scheduled_at;
          } else {
            // AIお任せ: recommended_timeを使用
            scheduledAt = candidate.recommended_time
              ? new Date(
                  new Date().toDateString() + " " + candidate.recommended_time
                ).toISOString()
              : new Date(Date.now() + 3600000).toISOString();
          }

          const schedRes = await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidate_id: id,
              account_id: candidate.account_id,
              variant_id: variant.id,
              scheduled_at: scheduledAt,
              post_mode: options?.post_mode || "A",
              custom_body_text: options?.custom_body_text,
            }),
          });

          if (!schedRes.ok) {
            console.error("Schedule creation failed:", await schedRes.text());
          } else {
            const schedData = await schedRes.json();
            const scheduledPostId = schedData.scheduled_post?.id;

            if (scheduleMode === "now" && scheduledPostId) {
              // 「今すぐ投稿」の場合、即座に投稿を実行
              console.log("[post] Triggering immediate post for:", scheduledPostId);
              const postRes = await fetch("/api/post-now", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduled_post_id: scheduledPostId }),
              });
              const result = await postRes.json();
              console.log("[post] Result:", result);
              if (result.posted > 0) {
                setCandidates((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, status: "approved" as const } : c))
                );
              } else if (result.error) {
                console.error("[post] Failed:", result.error);
              }
            }
          }
        }

        // 採用後: pending候補が少なければpipelineで自動補充
        try {
          const refreshRes = await fetch("/api/candidates?status=pending");
          if (refreshRes.ok) {
            const { candidates: newCandidates } = await refreshRes.json();
            const pendingCount = (newCandidates || []).length;

            if (pendingCount < 3) {
              console.log("[auto-replenish] Pending candidates low, running pipeline...");
              await fetch("/api/cron/pipeline", {
                headers: { Authorization: "Bearer yut000" },
              });
              // pipeline後に再取得
              const afterRes = await fetch("/api/candidates?status=pending");
              if (afterRes.ok) {
                const { candidates: freshCandidates } = await afterRes.json();
                setCandidates((prev) => {
                  const existing = prev.filter((c) => c.status !== "pending");
                  const existingIds = new Set(prev.map((c) => c.id));
                  const fresh = (freshCandidates || []).filter(
                    (c: CandidatePost) => !existingIds.has(c.id)
                  );
                  return [...existing, ...fresh];
                });
              }
            } else {
              setCandidates((prev) => {
                const existing = prev.filter((c) => c.status !== "pending");
                const existingIds = new Set(prev.map((c) => c.id));
                const fresh = (newCandidates || []).filter(
                  (c: CandidatePost) => !existingIds.has(c.id)
                );
                return [...existing, ...fresh];
              });
            }
          }
        } catch (err) {
          console.warn("Failed to refresh candidates:", err);
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
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
