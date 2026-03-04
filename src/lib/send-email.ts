/**
 * Send an email via the /api/auth/send-email endpoint.
 * Reads the latest outbox entry from demo-store and sends it as a real email.
 */
export async function sendEmailFromOutbox(
  to: string,
  subject: string,
  body: string,
  links: { label: string; url: string }[],
): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body, links }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    console.error("[sendEmailFromOutbox] Failed to send email");
    return false;
  }
}
