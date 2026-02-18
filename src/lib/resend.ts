import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendLoginOTP(email: string, otp: string) {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: "DineEasy <noreply@dineeasy.app>",
    to: email,
    subject: "Your DineEasy login code",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: Georgia, serif; font-size: 24px; color: #3E2723; margin-bottom: 8px;">DineEasy</h1>
        <p style="color: #6B705C; margin-bottom: 32px;">Your login verification code</p>
        <div style="background: #F5EFE6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #3E2723;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}
