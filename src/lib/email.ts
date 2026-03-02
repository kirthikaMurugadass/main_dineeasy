import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

if (!resendApiKey) {
  console.warn(
    "RESEND_API_KEY is not set. Password reset emails will fail until it is configured."
  );
}

const resend = new Resend(resendApiKey || "");

interface SendResetPasswordEmailOptions {
  to: string;
  resetLink: string;
}

export async function sendResetPasswordEmail({
  to,
  resetLink,
}: SendResetPasswordEmailOptions) {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const brandName = "DineEasy";

  await resend.emails.send({
    from: emailFrom,
    to,
    subject: "Reset your password",
    html: `
      <div style="background-color:#f5f5f7;padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
          <tr>
            <td style="padding:24px 24px 8px 24px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;background:#111827;color:#f9fafb;font-weight:600;font-size:18px;">
                D
              </div>
              <div style="margin-top:12px;font-size:20px;font-weight:600;color:#111827;">${brandName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <h1 style="margin:0 0 8px 0;font-size:20px;line-height:1.3;font-weight:600;color:#111827;">
                Reset your password
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                We received a request to reset the password for your ${brandName} account. If this was you, tap the button below to choose a new password.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;text-align:center;">
              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  padding:10px 22px;
                  border-radius:999px;
                  background:#111827;
                  color:#f9fafb;
                  font-size:14px;
                  font-weight:600;
                  text-decoration:none;
                  letter-spacing:0.03em;
                "
              >
                Reset password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 12px 24px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                For your security, this link will expire in <strong>15 minutes</strong>. If it expires, you can always request a new one.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 12px 24px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                If you did not request a password reset, you can safely ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
                If the button above does not work, copy and paste this link into your browser:
                <br />
                <a href="${resetLink}" style="color:#111827;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    `.trim(),
  });
}

