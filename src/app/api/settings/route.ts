import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import {
  getSystemSettings,
  getAccountSettings,
  getContentRules,
  updateSystemSettings,
  updateAccountSettings,
  getFirstActiveAccount,
} from "@/lib/db";
import { demoSystemSettings, demoAccountSettings, demoContentRules } from "@/lib/demo-data";

// GET /api/settings — 設定取得
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      system: demoSystemSettings,
      account: demoAccountSettings,
      rules: demoContentRules,
    });
  }

  try {
    const account = await getFirstActiveAccount();
    const [system, accountSettings, rules] = await Promise.all([
      getSystemSettings(),
      account ? getAccountSettings(account.id) : null,
      getContentRules(),
    ]);

    return NextResponse.json({
      system: system || demoSystemSettings,
      account: accountSettings || demoAccountSettings,
      rules: rules.length > 0 ? rules : demoContentRules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings", details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/settings — 設定更新
export async function PUT(request: Request) {
  const body = await request.json();

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      updated: body,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (body.system && body.system.id) {
      await updateSystemSettings(body.system.id, body.system);
    }
    if (body.account && body.account.id) {
      await updateAccountSettings(body.account.id, body.account);
    }

    return NextResponse.json({
      success: true,
      updated: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings", details: String(error) },
      { status: 500 }
    );
  }
}
