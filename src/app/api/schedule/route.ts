import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { getScheduledPosts, createScheduledPost, updateCandidateStatus } from "@/lib/db";
import { demoScheduled } from "@/lib/demo-data";

// GET /api/schedule — 予約一覧取得
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ scheduled: demoScheduled });
  }

  try {
    const scheduled = await getScheduledPosts();
    return NextResponse.json({ scheduled });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedule", details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/schedule — 予約登録
export async function POST(request: Request) {
  const body = await request.json();
  const { candidate_id, account_id, variant_id, scheduled_at } = body;

  if (!candidate_id || !variant_id || !scheduled_at) {
    return NextResponse.json(
      { error: "candidate_id, variant_id, scheduled_at required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      scheduled_post: {
        id: `sched-${Date.now()}`,
        candidate_id,
        variant_id,
        scheduled_at,
        status: "scheduled",
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const id = await createScheduledPost({
      candidate_id,
      account_id: account_id || "",
      variant_id,
      scheduled_at,
    });

    // 候補のステータスをapprovedに更新
    await updateCandidateStatus(candidate_id, "approved");

    return NextResponse.json({
      success: true,
      scheduled_post: {
        id,
        candidate_id,
        variant_id,
        scheduled_at,
        status: "scheduled",
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create schedule", details: String(error) },
      { status: 500 }
    );
  }
}
