import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, links } = await req.json();

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("[send-email] RESEND_API_KEY not set, skipping email send");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM || "SLOTY <onboarding@resend.dev>";

    // Build HTML email
    const linksHtml = (links as { label: string; url: string }[] | undefined)
      ?.map((l) => {
        const fullUrl = l.url.startsWith("http") ? l.url : `${getBaseUrl(req)}${l.url}`;
        return `<p style="margin:16px 0"><a href="${fullUrl}" style="display:inline-block;padding:12px 24px;background:#7B8CFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${l.label}</a></p>`;
      })
      .join("") ?? "";

    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333">
        <div style="padding:24px 0;text-align:center">
          <h1 style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#7B8CFF,#B79DFF,#F3A7C6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">SLOTY</h1>
        </div>
        <div style="padding:24px;background:#f9f9fb;border-radius:12px">
          <h2 style="font-size:18px;margin:0 0 12px">${subject}</h2>
          <p style="font-size:14px;line-height:1.6;color:#555">${body}</p>
          ${linksHtml}
        </div>
        <p style="margin-top:24px;font-size:11px;color:#999;text-align:center">
          このメールに心当たりがない場合は無視してください。
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[send-email] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[send-email] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}
