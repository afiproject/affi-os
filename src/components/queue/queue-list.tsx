"use client";

import { useState } from "react";
import type { ScheduledPost } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusLabel, getStatusColor, getToneLabel } from "@/lib/utils";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Props {
  scheduled: ScheduledPost[];
}

type FilterTab = "today" | "tomorrow" | "week" | "all";

export function QueueList({ scheduled: initial }: Props) {
  const [scheduled, setScheduled] = useState(initial);
  const [tab, setTab] = useState<FilterTab>("all");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const filtered = scheduled.filter((s) => {
    const d = new Date(s.scheduled_at);
    switch (tab) {
      case "today":
        return d.toISOString().split("T")[0] === todayStr;
      case "tomorrow":
        return d.toISOString().split("T")[0] === tomorrowStr;
      case "week":
        return d <= weekEnd;
      default:
        return true;
    }
  });

  function handlePause(id: string) {
    setScheduled((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === "paused" ? "scheduled" : "paused" } : s))
    );
  }

  function handleDelete(id: string) {
    setScheduled((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "cancelled" as const } : s))
    );
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "today", label: "今日" },
    { key: "tomorrow", label: "明日" },
    { key: "week", label: "今週" },
  ];

  const statusIcons: Record<string, typeof Clock> = {
    scheduled: Clock,
    pending_approval: AlertCircle,
    posted: CheckCircle2,
    failed: AlertCircle,
    paused: Pause,
    cancelled: Trash2,
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .map((post) => {
            const Icon = statusIcons[post.status] || Clock;
            return (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-mono font-medium">
                        {new Date(post.scheduled_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">
                          {post.candidate?.item?.title || "（タイトルなし）"}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${getStatusColor(post.status)}`}>
                          <Icon className="w-3 h-3" />
                          {getStatusLabel(post.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                        {post.custom_body_text || post.variant?.body_text || "（投稿文なし）"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {post.candidate?.item?.category || "不明"}
                        </Badge>
                        {post.variant && (
                          <>
                            <span>案{post.variant.variant_label}</span>
                            <span>{getToneLabel(post.variant.tone)}</span>
                          </>
                        )}
                        <span>{formatDate(post.scheduled_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(post.status === "scheduled" || post.status === "paused") && (
                        <>
                          <Button size="icon" variant="ghost" title="今すぐ投稿">
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={post.status === "paused" ? "再開" : "一時停止"}
                            onClick={() => handlePause(post.id)}
                          >
                            {post.status === "paused" ? (
                              <RefreshCw className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            title="削除"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {post.status === "failed" && (
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          再試行
                        </Button>
                      )}
                    </div>
                  </div>

                  {post.error_message && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                      {post.error_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          該当する予約はありません
        </div>
      )}
    </div>
  );
}
