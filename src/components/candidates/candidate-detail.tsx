"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CandidatePost, CandidatePostVariant } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getScoreColor,
  getToneLabel,
  getRiskSeverityColor,
  formatPercent,
} from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Star,
  AlertTriangle,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Hash,
  Link as LinkIcon,
  BarChart3,
  Brain,
  Shield,
} from "lucide-react";

interface Props {
  candidate: CandidatePost;
}

export function CandidateDetail({ candidate: initial }: Props) {
  const router = useRouter();
  const [candidate, setCandidate] = useState(initial);
  const [selectedVariantId, setSelectedVariantId] = useState(
    candidate.variants.find((v) => v.is_selected)?.id || candidate.variants[0]?.id
  );

  const selectedVariant = candidate.variants.find((v) => v.id === selectedVariantId);

  async function handleApprove() {
    setCandidate((c) => ({ ...c, status: "approved" }));
    try {
      await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: candidate.id, action: "approved" }),
      });
      const variant = selectedVariant || candidate.variants[0];
      if (variant) {
        await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: candidate.id,
            account_id: candidate.account_id,
            variant_id: variant.id,
            scheduled_at: candidate.recommended_time
              ? new Date(
                  new Date().toDateString() + " " + candidate.recommended_time
                ).toISOString()
              : new Date(Date.now() + 3600000).toISOString(),
          }),
        });
      }
    } catch (error) {
      console.error("Approve failed:", error);
    }
  }

  async function handleReject() {
    setCandidate((c) => ({ ...c, status: "rejected" }));
    try {
      await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: candidate.id, action: "rejected" }),
      });
    } catch (error) {
      console.error("Reject failed:", error);
    }
  }

  const scoreItems = [
    { label: "新着性", value: candidate.freshness_score },
    { label: "人気性", value: candidate.popularity_score },
    { label: "無料導線", value: candidate.free_trial_score },
    { label: "過去CTR", value: candidate.historical_ctr_score },
    { label: "時間帯適性", value: candidate.time_fitness_score },
    { label: "重複リスク", value: candidate.duplicate_risk_score, invert: true },
    { label: "安全性", value: candidate.safety_score },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/candidates")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> 候補一覧に戻る
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{candidate.item.category}</Badge>
                    {candidate.item.is_free_trial && <Badge variant="success">無料</Badge>}
                  </div>
                  <CardTitle className="text-lg">{candidate.item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {candidate.item.description}
                  </p>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(candidate.total_score)}`}>
                  {candidate.total_score}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{formatPercent(candidate.estimated_ctr)}</div>
                  <div className="text-xs text-muted-foreground">想定CTR</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{candidate.recommended_time}</div>
                  <div className="text-xs text-muted-foreground">推奨時間</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{candidate.variants.length}</div>
                  <div className="text-xs text-muted-foreground">文面案</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <CardTitle>AIの推薦理由</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{candidate.recommendation_reason}</p>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle>投稿文案</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candidate.variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    isSelected={variant.id === selectedVariantId}
                    onSelect={() => setSelectedVariantId(variant.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Post Preview */}
          {selectedVariant && (
            <Card>
              <CardHeader>
                <CardTitle>投稿プレビュー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-secondary/50 border">
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {selectedVariant.body_text}
                  </p>
                  {selectedVariant.hashtags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-blue-400 text-sm">
                      <Hash className="w-3 h-3" />
                      {selectedVariant.hashtags.join(" ")}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <LinkIcon className="w-3 h-3" />
                    {candidate.item.affiliate_url}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk flags */}
          {candidate.risk_flags.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <CardTitle>想定リスク</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidate.risk_flags.map((flag, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border ${getRiskSeverityColor(flag.severity)}`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{flag.message}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {flag.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidate.status === "pending" ? (
                <>
                  <Button className="w-full" variant="success" onClick={handleApprove}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    この内容で採用
                  </Button>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    文面だけ再生成
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    時間だけ変更
                  </Button>
                  <Button className="w-full" variant="outline">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    このカテゴリを優先
                  </Button>
                  <Button className="w-full" variant="outline">
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    このカテゴリを抑制
                  </Button>
                  <Button className="w-full" variant="destructive" onClick={handleReject}>
                    <XCircle className="w-4 h-4 mr-2" />
                    却下
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  この候補は{candidate.status === "approved" ? "採用済み" : "却下済み"}です
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <CardTitle>スコア内訳</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scoreItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.invert
                              ? item.value > 50
                                ? "bg-red-500"
                                : "bg-green-500"
                              : item.value >= 70
                              ? "bg-green-500"
                              : item.value >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-6 text-right">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Item info */}
          <Card>
            <CardHeader>
              <CardTitle>素材情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">カテゴリ</span>
                <span>{candidate.item.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">人気度</span>
                <span>{candidate.item.popularity_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">新着度</span>
                <span>{candidate.item.freshness_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">無料導線</span>
                <span>{candidate.item.is_free_trial ? "あり" : "なし"}</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {candidate.item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VariantCard({
  variant,
  isSelected,
  onSelect,
}: {
  variant: CandidatePostVariant;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-primary bg-secondary/50"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
          案{variant.variant_label}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {getToneLabel(variant.tone)} · {variant.length === "short" ? "短め" : variant.length === "long" ? "長め" : "普通"}
        </span>
        {isSelected && (
          <Star className="w-3 h-3 text-yellow-500 ml-auto" />
        )}
      </div>
      <p className="text-xs whitespace-pre-line leading-relaxed line-clamp-4">
        {variant.body_text}
      </p>
      {variant.hashtags.length > 0 && (
        <p className="text-[10px] text-blue-400 mt-1">{variant.hashtags.join(" ")}</p>
      )}
    </button>
  );
}
