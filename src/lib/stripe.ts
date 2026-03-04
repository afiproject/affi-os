import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// チケットパック定義
export const TICKET_PACKS = [
  {
    id: "pack_trial",
    name: "お試し",
    tickets: 10,
    priceYen: 160,
    unitPrice: 16,
  },
  {
    id: "pack_standard",
    name: "スタンダード",
    tickets: 50,
    priceYen: 650,
    unitPrice: 13,
    recommended: true,
  },
  {
    id: "pack_premium",
    name: "プレミアム",
    tickets: 120,
    priceYen: 1300,
    unitPrice: 10.8,
  },
  {
    id: "pack_mega",
    name: "メガ",
    tickets: 300,
    priceYen: 2800,
    unitPrice: 9.3,
  },
] as const;

export type TicketPack = (typeof TICKET_PACKS)[number];

// プラットフォーム手数料率
export const PLATFORM_FEE_RATE = 0.15; // 15%
export const STRIPE_FEE_RATE = 0.036; // 3.6%
