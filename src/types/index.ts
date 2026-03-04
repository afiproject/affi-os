import { type DefaultSession } from "next-auth";

// NextAuth セッション型拡張
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// API レスポンス型
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ページネーション
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// スロット検索パラメータ
export interface SlotSearchParams {
  timeStart?: string;
  timeEnd?: string;
  mode?: "call" | "in_person";
  category?: string;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

// 今から検索パラメータ
export interface SlotNowSearchParams {
  duration: number; // 分
  mode?: "call" | "in_person";
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

// スロット出品リクエスト
export interface CreateSlotRequest {
  startAt: string;
  endAt: string;
  durationMinutes: number;
  mode: "call" | "in_person";
  category: string;
  priceYen: number;
  areaType?: "city" | "radius" | "region";
  areaValue?: string;
  areaLat?: number;
  areaLng?: number;
  areaRadiusKm?: number;
  exactLocation?: string;
  bookingType: "instant" | "approval";
}

// 依頼リクエスト
export interface CreateRequestBody {
  desiredStartAt?: string;
  desiredWindow: "now" | "today" | "specified";
  mode: "call" | "in_person";
  durationMinutes: number;
  budgetYen: number;
  noteShort?: string;
}

// 広場投稿リクエスト
export interface CreateSquarePostRequest {
  text: string;
  tags: string[];
  preferredMode: "call" | "in_person" | "either";
}

// キャンセル返金計算結果
export interface CancelRefundResult {
  refundAmountYen: number;
  refundPercentage: number;
  penaltyApplied: boolean;
}
