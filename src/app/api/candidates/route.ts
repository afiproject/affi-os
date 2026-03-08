import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { getCandidates, updateCandidateStatus, createApprovalLog } from "@/lib/db";
import { demoCandidates } from "@/lib/demo-data";

// GET /api/candidates — 候補一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  if (isDemoMode()) {
    let candidates = [...demoCandidates];
    if (status && status !== "all") {
      candidates = candidates.filter((c) => c.status === status);
    }
    candidates.sort((a, b) => b.total_score - a.total_score);
    return NextResponse.json({ candidates });
  }

  try {
    const candidates = await getCandidates({ status });
    return NextResponse.json({ candidates });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch candidates", details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/candidates — 候補のステータス更新
export async function POST(request: Request) {
  const body = await request.json();
  const { id, action, note } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const validActions = ["approved", "rejected", "alternative_requested", "regenerate_requested"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      candidate_id: id,
      action,
      note,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await updateCandidateStatus(id, action);
    await createApprovalLog({ candidate_id: id, action, note });

    return NextResponse.json({
      success: true,
      candidate_id: id,
      action,
      note,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update candidate", details: String(error) },
      { status: 500 }
    );
  }
}
