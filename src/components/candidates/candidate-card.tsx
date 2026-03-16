"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CandidatePost } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getScoreColor,
  getStatusLabel,
  getStatusColor,
  getToneLabel,
  getRiskSeverityColor,
  formatPercent,
} from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Clock,
  Star,
  Film,
  Play,
  X,
  Zap,
  CalendarClock,
  Bot,
} from "lucide-react";

type ScheduleMode = "now" | "custom" | "ai";

interface Props {
  candidate: CandidatePost;
  onAction: (
    id: string,
    action: "approved" | "rejected" | "regenerate_requested",
    options?: {
      post_mode?: "A" | "B";
      custom_body_text?: string;
      schedule_mode?: ScheduleMode;
      scheduled_at?: string;
    }
  ) => void;
  isCachingVideo?: boolean;
}

export function CandidateCard({ candidate, onAction, isCachingVideo }: Props) {
  const selectedVariant = candidate.variants.find((v) => v.is_selected) || candidate.variants[0];
  const [postMode, setPostMode] = useState<"A" | "B">("A");
  const hasVariants = candidate.variants.length > 0;
  const [useCustomText, setUseCustomText] = useState(!hasVariants);
  const [customText, setCustomText] = useState("");
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [customTime, setCustomTime] = useState("");

  const handleApprove = () => {
    onAction(candidate.id, "approved", {
      post_mode: postMode,
      custom_body_text: useCustomText && customText.trim() ? customText.trim() : undefined,
      schedule_mode: scheduleMode,
      scheduled_at: scheduleMode === "custom" && customTime
        ? new Date(new Date().toDateString() + " " + customTime).toISOString()
        : undefined,
    });
    setShowApproveForm(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px]">
                {candidate.item.category}
              </Badge>
              {candidate.item.is_free_trial && (
                <Badge variant="success" className="text-[10px]">無料</Badge>
              )}
              {candidate.item.sample_video_url && (
                <Badge variant="outline" className="text-[10px]">
                  <Film className="w-2.5 h-2.5 mr-0.5" />動画
                </Badge>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(candidate.status)}`}>
                {getStatusLabel(candidate.status)}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-tight truncate">
              {candidate.item.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={`text-lg font-bold ${getScoreColor(candidate.total_score)}`}>
              {candidate.total_score}
            </div>
            <span className="text-[10px] text-muted-foreground">AIスコア</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* サムネイル表示（タップで動画プレビュー） */}
        {candidate.item.thumbnail_url && (
          <div
            className="relative w-full aspect-video rounded-md overflow-hidden bg-secondary cursor-pointer group"
            onClick={() => candidate.item.sample_video_url && setShowVideoPreview(true)}
          >
            <Image
              src={candidate.item.thumbnail_url}
              alt={candidate.item.title}
              fill
              className="object-cover"
              unoptimized
            />
            {candidate.item.sample_video_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-black ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 動画プレビューモーダル */}
        {showVideoPreview && (candidate.item.cached_video_url || candidate.item.sample_video_url) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowVideoPreview(false)}>
            <div className="relative w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowVideoPreview(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
              <video
                src={candidate.item.cached_video_url || candidate.item.sample_video_url}
                controls
                autoPlay
                className="w-full rounded-lg"
              >
                お使いのブラウザは動画再生に対応していません
              </video>
              <p className="text-white text-xs mt-2 text-center">{candidate.item.title}</p>
            </div>
          </div>
        )}

        {/* Recommendation reason */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {candidate.recommendation_reason}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>CTR {formatPercent(candidate.estimated_ctr)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>{candidate.recommended_time}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {candidate.variants.length}案
          </div>
        </div>

        {/* Selected variant preview */}
        {selectedVariant ? (
          <div className="p-2 rounded-md bg-secondary/50 border">
            <div className="flex items-center gap-1 mb-1">
              <Badge variant="outline" className="text-[10px]">
                案{selectedVariant.variant_label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {getToneLabel(selectedVariant.tone)}
              </span>
            </div>
            <p className="text-xs leading-relaxed line-clamp-3 whitespace-pre-line">
              {selectedVariant.body_text}
            </p>
          </div>
        ) : (
          <div className="p-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
            AI投稿文が未生成です。「自分で入力」から投稿できます。
          </div>
        )}

        {/* Risk flags */}
        {candidate.risk_flags.length > 0 && (
          <div className="space-y-1">
            {candidate.risk_flags.map((flag, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border ${getRiskSeverityColor(flag.severity)}`}
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                {flag.message}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {candidate.item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* 承認フォーム（展開時） */}
        {showApproveForm && candidate.status === "pending" && (
          <div className="space-y-3 p-3 rounded-md border border-green-200 bg-green-50/50">
            {/* 投稿モード選択 */}
            <div>
              <label className="text-xs font-medium mb-1 block">投稿モード</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPostMode("A")}
                  className={`flex-1 text-[11px] p-2 rounded border text-left ${
                    postMode === "A"
                      ? "border-green-500 bg-green-50 text-green-800"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">A: 1ツイート</div>
                  <div className="text-muted-foreground mt-0.5">動画+テキスト+リンク</div>
                </button>
                <button
                  onClick={() => setPostMode("B")}
                  className={`flex-1 text-[11px] p-2 rounded border text-left ${
                    postMode === "B"
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">B: リプライ</div>
                  <div className="text-muted-foreground mt-0.5">動画+テキスト → リプにリンク</div>
                </button>
              </div>
            </div>

            {/* 投稿時間の選択 */}
            <div>
              <label className="text-xs font-medium mb-1 block">投稿タイミング</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setScheduleMode("now")}
                  className={`flex-1 text-[11px] p-2 rounded border text-center ${
                    scheduleMode === "now"
                      ? "border-orange-500 bg-orange-50 text-orange-800"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  今すぐ
                </button>
                <button
                  onClick={() => setScheduleMode("custom")}
                  className={`flex-1 text-[11px] p-2 rounded border text-center ${
                    scheduleMode === "custom"
                      ? "border-purple-500 bg-purple-50 text-purple-800"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CalendarClock className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  時間指定
                </button>
                <button
                  onClick={() => setScheduleMode("ai")}
                  className={`flex-1 text-[11px] p-2 rounded border text-center ${
                    scheduleMode === "ai"
                      ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  AIお任せ
                </button>
              </div>
              {scheduleMode === "custom" && (
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="mt-1.5 w-full text-xs p-2 rounded border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
              {scheduleMode === "ai" && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  AIが最適な投稿時間を自動選択します（推奨: {candidate.recommended_time}）
                </p>
              )}
            </div>

            {/* テキスト編集 */}
            <div>
              <label className="text-xs font-medium mb-1 block">投稿テキスト</label>
              <div className="flex gap-2 mb-1">
                <button
                  onClick={() => hasVariants && setUseCustomText(false)}
                  disabled={!hasVariants}
                  className={`text-[11px] px-2 py-1 rounded ${
                    !useCustomText ? "bg-primary text-primary-foreground" : "bg-secondary"
                  } ${!hasVariants ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  AI生成を使う{!hasVariants && "（未生成）"}
                </button>
                <button
                  onClick={() => {
                    setUseCustomText(true);
                    if (!customText && selectedVariant) {
                      setCustomText(selectedVariant.body_text);
                    }
                  }}
                  className={`text-[11px] px-2 py-1 rounded ${
                    useCustomText ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  自分で入力
                </button>
              </div>
              {useCustomText && (
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="投稿テキストを入力..."
                  className="w-full text-xs p-2 rounded border resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={280}
                />
              )}
            </div>

            {/* 承認/キャンセルボタン */}
            <div className="flex gap-2">
              <Button size="sm" variant="success" className="flex-1" onClick={handleApprove}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                {scheduleMode === "now" ? "今すぐ投稿" : "投稿を確定"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowApproveForm(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* 動画キャッシュ中の表示 */}
        {isCachingVideo && (
          <div className="flex items-center gap-2 p-3 rounded-md border border-blue-200 bg-blue-50/50 text-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-xs">動画をキャッシュ中...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t">
          {candidate.status === "pending" && !showApproveForm && !isCachingVideo && (
            <>
              <Button
                size="sm"
                variant="success"
                className="flex-1"
                onClick={() => setShowApproveForm(true)}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                採用
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onAction(candidate.id, "rejected")}
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(candidate.id, "regenerate_requested")}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          <Link href={`/candidates/${candidate.id}`} className="ml-auto">
            <Button size="sm" variant="ghost">
              詳細 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
