"use client";

import { useState } from "react";
import type { SystemSettings, AccountSettings, ContentRule } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  Brain,
  Clock,
  Ban,
  Star,
  MessageSquare,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

interface Props {
  system: SystemSettings;
  account: AccountSettings;
  rules: ContentRule[];
}

type SettingsTab = "general" | "posting" | "content" | "ai" | "rules";

export function SettingsPanel({ system: initialSystem, account: initialAccount, rules: initialRules }: Props) {
  const [system, setSystem] = useState(initialSystem);
  const [account, setAccount] = useState(initialAccount);
  const [rules, setRules] = useState(initialRules);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  const tabs: { key: SettingsTab; label: string; icon: typeof Settings }[] = [
    { key: "general", label: "全般", icon: Settings },
    { key: "posting", label: "投稿ルール", icon: Clock },
    { key: "content", label: "コンテンツ", icon: MessageSquare },
    { key: "ai", label: "AI設定", icon: Brain },
    { key: "rules", label: "ルール管理", icon: Shield },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* General */}
      {tab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle>全般設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="システムステータス">
              <Badge variant="success">稼働中</Badge>
            </SettingRow>
            <SettingRow label="自動素材収集">
              <ToggleButton
                value={system.auto_collect_enabled}
                onChange={(v) => setSystem({ ...system, auto_collect_enabled: v })}
              />
            </SettingRow>
            <SettingRow label="自動スコアリング">
              <ToggleButton
                value={system.auto_score_enabled}
                onChange={(v) => setSystem({ ...system, auto_score_enabled: v })}
              />
            </SettingRow>
            <SettingRow label="自動文面生成">
              <ToggleButton
                value={system.auto_generate_enabled}
                onChange={(v) => setSystem({ ...system, auto_generate_enabled: v })}
              />
            </SettingRow>
            <SettingRow label="自動投稿（承認不要）">
              <ToggleButton
                value={system.auto_post_enabled}
                onChange={(v) => setSystem({ ...system, auto_post_enabled: v })}
              />
            </SettingRow>
            <SettingRow label="リスク閾値">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={system.risk_threshold}
                  onChange={(e) => setSystem({ ...system, risk_threshold: Number(e.target.value) })}
                  className="w-32"
                />
                <span className="text-sm font-mono w-8">{system.risk_threshold}</span>
              </div>
            </SettingRow>
          </CardContent>
        </Card>
      )}

      {/* Posting rules */}
      {tab === "posting" && (
        <Card>
          <CardHeader>
            <CardTitle>投稿ルール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="1日の投稿上限">
              <NumberInput
                value={system.daily_post_limit}
                onChange={(v) => setSystem({ ...system, daily_post_limit: v })}
                min={1}
                max={20}
              />
            </SettingRow>
            <SettingRow label="連投間隔（分）">
              <NumberInput
                value={system.min_interval_minutes}
                onChange={(v) => setSystem({ ...system, min_interval_minutes: v })}
                min={15}
                max={360}
              />
            </SettingRow>
            <SettingRow label="深夜投稿を許可">
              <ToggleButton
                value={system.allow_night_posts}
                onChange={(v) => setSystem({ ...system, allow_night_posts: v })}
              />
            </SettingRow>
            {!system.allow_night_posts && (
              <>
                <SettingRow label="深夜開始（時）">
                  <NumberInput
                    value={system.night_start_hour}
                    onChange={(v) => setSystem({ ...system, night_start_hour: v })}
                    min={0}
                    max={6}
                  />
                </SettingRow>
                <SettingRow label="深夜終了（時）">
                  <NumberInput
                    value={system.night_end_hour}
                    onChange={(v) => setSystem({ ...system, night_end_hour: v })}
                    min={4}
                    max={10}
                  />
                </SettingRow>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content settings */}
      {tab === "content" && (
        <Card>
          <CardHeader>
            <CardTitle>コンテンツ設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="推奨トーン">
              <select
                value={account.preferred_tone}
                onChange={(e) => setAccount({ ...account, preferred_tone: e.target.value })}
                className="px-3 py-1.5 text-sm rounded-md border bg-background"
              >
                <option value="natural">自然体</option>
                <option value="click_bait">クリック重視</option>
                <option value="casual">カジュアル</option>
                <option value="informative">情報提供</option>
                <option value="urgent">緊急感</option>
              </select>
            </SettingRow>
            <SettingRow label="推奨文長">
              <select
                value={account.preferred_length}
                onChange={(e) => setAccount({ ...account, preferred_length: e.target.value })}
                className="px-3 py-1.5 text-sm rounded-md border bg-background"
              >
                <option value="short">短め</option>
                <option value="medium">普通</option>
                <option value="long">長め</option>
              </select>
            </SettingRow>
            <SettingRow label="優先カテゴリ">
              <div className="flex flex-wrap gap-1">
                {account.priority_categories.map((cat) => (
                  <Badge key={cat} variant="success">{cat}</Badge>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="NGカテゴリ">
              <div className="flex flex-wrap gap-1">
                {account.ng_categories.length === 0 ? (
                  <span className="text-xs text-muted-foreground">設定なし</span>
                ) : (
                  account.ng_categories.map((cat) => (
                    <Badge key={cat} variant="destructive">{cat}</Badge>
                  ))
                )}
              </div>
            </SettingRow>
          </CardContent>
        </Card>
      )}

      {/* AI settings */}
      {tab === "ai" && (
        <Card>
          <CardHeader>
            <CardTitle>AI設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="AIプロバイダー">
              <select
                value={system.ai_provider}
                onChange={(e) => setSystem({ ...system, ai_provider: e.target.value as "claude" | "openai" })}
                className="px-3 py-1.5 text-sm rounded-md border bg-background"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
              </select>
            </SettingRow>
            <SettingRow label="モデル">
              <input
                type="text"
                value={system.ai_model}
                onChange={(e) => setSystem({ ...system, ai_model: e.target.value })}
                className="px-3 py-1.5 text-sm rounded-md border bg-background w-64"
              />
            </SettingRow>
            <SettingRow label="APIキー">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value="••••••••••••••••"
                  readOnly
                  className="px-3 py-1.5 text-sm rounded-md border bg-background w-48"
                />
                <span className="text-xs text-muted-foreground">環境変数で管理</span>
              </div>
            </SettingRow>
          </CardContent>
        </Card>
      )}

      {/* Rules */}
      {tab === "rules" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ルール管理</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5 mr-1" />
                ルール追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    {rule.rule_type === "ng_word" && <Ban className="w-4 h-4 text-red-500" />}
                    {rule.rule_type === "priority_category" && <Star className="w-4 h-4 text-yellow-500" />}
                    {rule.rule_type === "ng_category" && <Ban className="w-4 h-4 text-red-500" />}
                    <div>
                      <span className="text-sm font-medium">{rule.value}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {rule.rule_type === "ng_word"
                          ? "NGワード"
                          : rule.rule_type === "priority_category"
                          ? "優先カテゴリ"
                          : rule.rule_type === "ng_category"
                          ? "NGカテゴリ"
                          : "必須ハッシュタグ"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          設定を保存
        </Button>
        {saved && (
          <span className="text-sm text-green-500">保存しました</span>
        )}
      </div>
    </div>
  );
}

// ---------- Sub Components ----------

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function ToggleButton({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? "bg-green-600" : "bg-secondary"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (v >= min && v <= max) onChange(v);
      }}
      min={min}
      max={max}
      className="px-3 py-1.5 text-sm rounded-md border bg-background w-20 text-right"
    />
  );
}
