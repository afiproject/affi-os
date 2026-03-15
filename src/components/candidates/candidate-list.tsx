"use client";

import { useState } from "react";
import type { CandidatePost } from "@/types";
import { CandidateCard } from "./candidate-card";

interface Props {
  candidates: CandidatePost[];
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export function CandidateList({ candidates: initial }: Props) {
  const [candidates, setCandidates] = useState(initial);
  const [filter, setFilter] = useState<FilterStatus>("all");

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
          }
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
