"use client";

import { useState, useCallback } from "react";

interface ImportResult {
  row: number;
  status: string;
  scheduled_at?: string;
  error?: string;
}

interface ImportResponse {
  success: boolean;
  import_id: string;
  total: number;
  processed: number;
  failed: number;
  results: ImportResult[];
}

interface ImportHistory {
  id: string;
  filename: string;
  source: string;
  rows_total: number;
  rows_processed: number;
  rows_failed: number;
  status: string;
  created_at: string;
}

const SAMPLE_CSV = `scheduled_time,body_text,hashtags,video_url,thumbnail_url,affiliate_url,category,tags,post_mode
10:00,"今夜のおすすめ作品はこちら！人気急上昇中の注目作品です",#FANZA #おすすめ,https://example.com/video.mp4,https://example.com/thumb.jpg,https://al.dmm.co.jp/?lurl=https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=abc00123/&af_id=affiking1414-990,動画,人気作品,A
12:30,"限定セール中！今だけの特別価格でお楽しみいただけます",#FANZA #セール,,https://example.com/thumb2.jpg,https://al.dmm.co.jp/?lurl=https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=def00456/&af_id=affiking1414-990,動画,セール,A
21:00,"深夜のイチオシ作品をご紹介します",#深夜 #おすすめ,https://example.com/video3.mp4,,https://al.dmm.co.jp/?lurl=https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=ghi00789/&af_id=affiking1414-990,動画,深夜向け,B`;

export default function ImportPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [mode, setMode] = useState<"file" | "paste">("paste");

  const handleUpload = useCallback(async (csvData: string | File) => {
    setUploading(true);
    setError("");
    setResult(null);

    try {
      let res: Response;
      if (csvData instanceof File) {
        const formData = new FormData();
        formData.append("file", csvData);
        res = await fetch("/api/import-csv", {
          method: "POST",
          headers: { Authorization: `Bearer yut000` },
          body: formData,
        });
      } else {
        res = await fetch("/api/import-csv", {
          method: "POST",
          headers: {
            Authorization: `Bearer yut000`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ csv_text: csvData, filename: "paste-import.csv" }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/import-csv", {
        headers: { Authorization: `Bearer yut000` },
      });
      const data = await res.json();
      if (data.imports) setHistory(data.imports);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Noimos AI CSV連携</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Noimos AIからのCSVデータをインポートして自動投稿をスケジュール
        </p>
      </div>

      {/* CSVフォーマット説明 */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">CSVフォーマット</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>必須列:</strong> scheduled_time, body_text</p>
          <p><strong>任意列:</strong> hashtags, video_url, thumbnail_url, affiliate_url, category, tags, post_mode</p>
          <p><strong>scheduled_time:</strong> &quot;10:00&quot;(HH:MM) or ISO形式。HH:MMの場合、過去なら翌日に自動調整</p>
          <p><strong>post_mode:</strong> A=1ツイート / B=本文+リプライにリンク</p>
        </div>
        <details className="mt-2">
          <summary className="text-xs text-primary cursor-pointer">サンプルCSVを見る</summary>
          <pre className="mt-2 text-[10px] bg-muted p-2 rounded overflow-x-auto whitespace-pre">
            {SAMPLE_CSV}
          </pre>
          <button
            className="mt-1 text-xs text-primary hover:underline"
            onClick={() => {
              setCsvText(SAMPLE_CSV);
              setMode("paste");
            }}
          >
            サンプルをペースト欄にコピー
          </button>
        </details>
      </div>

      {/* アップロードエリア */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${mode === "paste" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("paste")}
          >
            テキスト貼り付け
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${mode === "file" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("file")}
          >
            ファイルアップロード
          </button>
        </div>

        {mode === "paste" ? (
          <div className="space-y-2">
            <textarea
              className="w-full h-48 p-3 text-xs font-mono rounded border bg-background resize-y"
              placeholder="CSVデータをここに貼り付け..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              disabled={uploading || !csvText.trim()}
              onClick={() => handleUpload(csvText)}
            >
              {uploading ? "インポート中..." : "インポート実行"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <p className="text-sm text-muted-foreground">
                {uploading ? "アップロード中..." : "CSVファイルをクリックまたはドラッグで選択"}
              </p>
            </label>
          </div>
        )}
      </div>

      {/* エラー */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 結果 */}
      {result && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">
            インポート結果: {result.processed}件成功 / {result.failed}件失敗
          </h3>
          <div className="space-y-1">
            {result.results.map((r) => (
              <div
                key={r.row}
                className={`text-xs px-2 py-1 rounded ${
                  r.status === "scheduled"
                    ? "bg-green-500/10 text-green-600"
                    : r.status === "skipped"
                      ? "bg-yellow-500/10 text-yellow-600"
                      : "bg-red-500/10 text-red-600"
                }`}
              >
                Row {r.row}: {r.status}
                {r.scheduled_at && ` → ${new Date(r.scheduled_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`}
                {r.error && ` (${r.error})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 履歴 */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">インポート履歴</h3>
          <button
            className="text-xs text-primary hover:underline disabled:opacity-50"
            onClick={loadHistory}
            disabled={loadingHistory}
          >
            {loadingHistory ? "読込中..." : "更新"}
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">履歴なし。「更新」を押して確認</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">{h.filename}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(h.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">{h.rows_processed}成功</span>
                  {h.rows_failed > 0 && <span className="text-red-600">{h.rows_failed}失敗</span>}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      h.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Noimos AI連携ガイド */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">Noimos AIからデータを受け取る方法</h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>1. Noimos AIでSNS戦略分析を実行</p>
          <p>2. 出力された投稿計画データをCSV形式でエクスポート</p>
          <p>3. 上のフォームに貼り付けてインポート</p>
          <p>4. 自動でXに投稿がスケジュールされます</p>
          <hr className="my-2" />
          <p className="font-medium text-foreground">API経由の自動連携:</p>
          <pre className="bg-muted p-2 rounded overflow-x-auto">
{`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app"}/api/import-csv \\
  -H "Authorization: Bearer yut000" \\
  -H "Content-Type: application/json" \\
  -d '{"csv_text": "scheduled_time,body_text\\n10:00,投稿テスト"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
