// ========================================
// Affiliate Source Adapter
// ASP/素材取得の抽象インターフェース
// ========================================

import type { AffiliateItem } from "@/types";
import { demoItems } from "@/lib/demo-data";

export interface AffiliateSourceAdapter {
  readonly name: string;
  fetchItems(options?: FetchOptions): Promise<AffiliateItem[]>;
}

export interface FetchOptions {
  category?: string;
  limit?: number;
  sortBy?: "newest" | "popular" | "ranking";
}

// ---------- Demo Adapter ----------
export class DemoAffiliateSource implements AffiliateSourceAdapter {
  readonly name = "demo";

  async fetchItems(options?: FetchOptions): Promise<AffiliateItem[]> {
    let items = [...demoItems];

    if (options?.category) {
      items = items.filter((i) => i.category === options.category);
    }

    if (options?.sortBy === "popular") {
      items.sort((a, b) => b.popularity_score - a.popularity_score);
    } else if (options?.sortBy === "newest") {
      items.sort((a, b) => b.freshness_score - a.freshness_score);
    }

    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }
}

// ---------- DMM/FANZA Adapter ----------
// Powered by FANZA Webサービス
export class DMMAdapter implements AffiliateSourceAdapter {
  readonly name = "dmm";

  private get apiId(): string {
    return process.env.DMM_API_ID || "";
  }

  private get affiliateId(): string {
    return process.env.DMM_AFFILIATE_ID || "";
  }

  async fetchItems(options?: FetchOptions): Promise<AffiliateItem[]> {
    if (!this.apiId || !this.affiliateId) {
      console.error("[DMMAdapter] DMM_API_ID or DMM_AFFILIATE_ID not set");
      return [];
    }

    const hits = options?.limit || 20;
    let sort = "date";
    if (options?.sortBy === "popular" || options?.sortBy === "ranking") {
      sort = "rank";
    }

    const params = new URLSearchParams({
      api_id: this.apiId,
      affiliate_id: this.affiliateId,
      site: "FANZA",
      service: "digital",
      floor: "videoa",
      hits: String(hits),
      sort,
      output: "json",
    });

    if (options?.category) {
      params.set("keyword", options.category);
    }

    const url = `https://api.dmm.com/affiliate/v3/ItemList?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[DMMAdapter] API error: ${res.status} ${res.statusText}`);
        return [];
      }

      const data = await res.json();
      const items: AffiliateItem[] = [];

      for (const item of data.result?.items || []) {
        const genres = (item.iteminfo?.genre || []).map((g: { name: string }) => g.name);
        const actresses = (item.iteminfo?.actress || []).map((a: { name: string }) => a.name);
        const tags = [...genres, ...actresses].slice(0, 10);
        const category = genres[0] || "動画";

        // サンプル動画URL（高画質優先）
        const sampleVideoUrl = item.sampleMovieURL?.size_720_480 || item.sampleMovieURL?.size_476_306 || "";
        const hasSample = !!sampleVideoUrl;

        // 人気スコア（レビュー数ベース）
        const reviewCount = item.review?.count || 0;
        const reviewAvg = item.review?.average || 0;
        const popularityScore = Math.min(100, reviewCount * 2 + reviewAvg * 10);

        // 新しさスコア（日付ベース）
        const releaseDate = item.date ? new Date(item.date) : new Date();
        const daysSinceRelease = Math.max(0, (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
        const freshnessScore = Math.max(0, 100 - daysSinceRelease * 2);

        items.push({
          id: "",
          source_id: "",
          external_id: item.content_id || item.product_id || "",
          title: item.title || "",
          description: actresses.length > 0 ? `出演: ${actresses.join(", ")}` : "",
          category,
          tags,
          thumbnail_url: item.imageURL?.large || item.imageURL?.small || "",
          sample_video_url: sampleVideoUrl,
          affiliate_url: item.affiliateURL || "",
          is_free_trial: hasSample,
          popularity_score: popularityScore,
          freshness_score: freshnessScore,
          collected_at: new Date().toISOString(),
          is_excluded: false,
        });
      }

      console.log(`[DMMAdapter] Fetched ${items.length} items from FANZA`);
      return items;
    } catch (error) {
      console.error(`[DMMAdapter] Fetch error: ${String(error)}`);
      return [];
    }
  }
}

// ---------- Factory ----------
export function createAffiliateSource(sourceName?: string): AffiliateSourceAdapter {
  switch (sourceName) {
    case "fanza":
    case "dmm":
      return new DMMAdapter();
    default:
      return new DemoAffiliateSource();
  }
}
