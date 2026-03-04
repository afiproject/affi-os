import { IS_DEMO } from "./demo-data";

// DEMO_MODE: Stripe を初期化しない
let stripeInstance: any = null;

if (!IS_DEMO && process.env.STRIPE_SECRET_KEY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe").default;
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    });
  } catch {
    console.warn("[SLOTY] Stripe not available.");
  }
}

export const stripe = stripeInstance;

// チケットパック定義（Stripe無関係なので常に利用可能）
export const TICKET_PACKS = [
  { id: "pack_trial", name: "お試し", tickets: 10, priceYen: 160, unitPrice: 16 },
  { id: "pack_standard", name: "スタンダード", tickets: 50, priceYen: 650, unitPrice: 13, recommended: true },
  { id: "pack_premium", name: "プレミアム", tickets: 120, priceYen: 1300, unitPrice: 10.8 },
  { id: "pack_mega", name: "メガ", tickets: 300, priceYen: 2800, unitPrice: 9.3 },
] as const;

export type TicketPack = (typeof TICKET_PACKS)[number];

export const PLATFORM_FEE_RATE = 0.15;
export const STRIPE_FEE_RATE = 0.036;
