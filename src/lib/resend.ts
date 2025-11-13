export interface SendEmailArgs {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail({
  to,
  from,
  subject,
  html,
  text,
}: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.RESEND_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const payload: Record<string, unknown> = {
    from: from || defaultFrom,
    to,
    subject,
  };

  if (html) payload.html = html;
  if (text) payload.text = text;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const obj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
    const message =
      typeof obj.error === "string"
        ? obj.error
        : typeof obj.message === "string"
        ? obj.message
        : `Resend responded ${res.status}`;
    const err: Error & { response?: unknown } = new Error(`Resend sendEmail failed: ${message}`);
    err.response = data;
    throw err;
  }

  // Return parsed response (may include id or message metadata)
  return data;
}


