/**
 * BizMate AI transactional email delivery through Resend.
 * The API key is read only from server-side environment variables.
 */
type WelcomeEmailInput = {
  to: string;
  name: string;
};

type ResendSendResponse = {
  id?: string;
  message?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char] || char);
}

export class EmailService {
  static async sendWelcomeEmail({ to, name }: WelcomeEmailInput): Promise<{ sent: boolean; reason?: string; id?: string }> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      console.warn('[EmailService] Welcome email skipped: RESEND_API_KEY or EMAIL_FROM is not configured.');
      return { sent: false, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const safeName = escapeHtml(name.trim() || 'there');
    const payload = {
      from,
      to: [to.trim().toLowerCase()],
      subject: 'Welcome to BizMate AI',
      text: `Hi ${name.trim() || 'there'},\n\nWelcome to BizMate AI! Your account is ready. You can now explore AI-powered marketing content and creative tools for your business.\n\nIf you did not create this account, you can ignore this email.\n\n— BizMate AI Team`,
      html: `<!doctype html><html lang="en"><body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033"><div style="max-width:600px;margin:32px auto;padding:32px;background:#fff;border-radius:16px"><p style="font-weight:700;color:#4f46e5">BizMate AI</p><h1 style="font-size:26px">Welcome, ${safeName}!</h1><p>Your account is ready. Explore AI-powered marketing content and creative tools built to help your business grow.</p><p style="margin-top:28px;color:#64748b;font-size:13px">If you did not create this account, you can ignore this email.</p><p>— BizMate AI Team</p></div></body></html>`
    };

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json() as ResendSendResponse;
      if (!response.ok) {
        console.error('[EmailService] Resend rejected welcome email:', response.status, result.message || 'Unknown provider error');
        return { sent: false, reason: 'PROVIDER_REJECTED' };
      }
      return { sent: true, id: result.id };
    } catch (error) {
      console.error('[EmailService] Resend request failed:', error instanceof Error ? error.message : 'Unknown network error');
      return { sent: false, reason: 'PROVIDER_UNAVAILABLE' };
    }
  }
}
