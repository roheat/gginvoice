export function createInvoiceEmail(invoice: any) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
  const base = appUrl.replace(/\/$/, "");
  const publicLink = `${base}/invoices/${invoice.shareId}`;

  const clientName = invoice.client?.name || invoice.client?.email || "Client";
  const subject = `Invoice ${invoice.number} for ${clientName}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111; line-height:1.4">
      <h2>Invoice ${invoice.number}</h2>
      <p>Hi ${clientName},</p>
      <p>${invoice.user?.name ? `${invoice.user.name} has` : "You have"} received an invoice.</p>
      <p>
        <strong>Amount:</strong> ${invoice.currency} ${invoice.total}
      </p>
      <p>
        <a href="${publicLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">
          View Invoice
        </a>
      </p>
      <p style="color:#666">Or open this link: <a href="${publicLink}">${publicLink}</a></p>
      <hr/>
      <p style="color:#888;font-size:13px">This email was sent from your invoicing app.</p>
    </div>
  `;

  const text = `Invoice ${invoice.number}\n\nAmount: ${invoice.currency} ${invoice.total}\n\nView invoice: ${publicLink}`;

  return { subject, html, text };
}



