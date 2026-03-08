// ========================================
// Supabase Admin Client (Service Role)
// Cronジョブ・バックエンド操作用
// ========================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: SupabaseClient<any, "public", any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminClient(): SupabaseClient<any, "public", any> {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL or service role key not configured");
  }

  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1" || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}
