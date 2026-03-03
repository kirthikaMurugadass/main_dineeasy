import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

if (!resendApiKey) {
  console.warn(
    "[Email] RESEND_API_KEY is not set. Booking and password reset emails will fail until it is configured."
  );
} else {
  console.log("[Email] RESEND_API_KEY is configured:", true);
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

  try {
    console.log("[Email] Sending reset password email to:", to);
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
    console.log("[Email] Reset password email sent");
  } catch (error) {
    console.error("[Email] Error sending reset password email:", error);
    throw error;
  }
}

interface SendBookingNotificationEmailOptions {
  to: string;
  restaurantName: string;
  customerName: string;
  phone: string;
  email: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  specialNote: string | null;
}

export async function sendBookingNotificationEmail({
  to,
  restaurantName,
  customerName,
  phone,
  email,
  bookingDate,
  bookingTime,
  guestCount,
  specialNote,
}: SendBookingNotificationEmailOptions) {
  if (!resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping booking notification email");
    return;
  }

  const brandName = "DineEasy";
  const formattedDate = new Date(bookingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    console.log("[Email] Sending admin booking notification email to:", to, "for restaurant:", restaurantName);
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `New Table Booking Request - ${restaurantName}`,
      html: `
      <div style="background-color:#f5f5f7;padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
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
                New Table Booking Request
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                You have received a new table booking request for <strong>${restaurantName}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <div style="background:#f9fafb;border-radius:12px;padding:16px;">
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Customer Name:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${customerName}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Phone Number:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${phone}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Email:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${email}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Date:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${formattedDate}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Time:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${bookingTime}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Number of Guests:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${guestCount} ${guestCount === 1 ? "Guest" : "Guests"}</span>
                </div>
                ${specialNote ? `
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
                  <strong style="color:#111827;">Special Requests:</strong>
                  <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#4b5563;">${specialNote}</p>
                </div>
                ` : ""}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;text-align:center;">
              <a
                href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/bookings"
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
                View Booking in Dashboard
              </a>
            </td>
          </tr>
        </table>
      </div>
    `.trim(),
    });
    console.log("[Email] Admin booking notification email sent");
  } catch (error) {
    console.error("[Email] Error sending admin booking notification email:", error);
    throw error;
  }
}

interface SendBookingConfirmationEmailOptions {
  to: string;
  restaurantName: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
}

export async function sendBookingConfirmationEmail({
  to,
  restaurantName,
  customerName,
  bookingDate,
  bookingTime,
  guestCount,
}: SendBookingConfirmationEmailOptions) {
  if (!resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping booking confirmation email");
    return;
  }

  const brandName = "DineEasy";
  const formattedDate = new Date(bookingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    console.log("[Email] Sending booking confirmation email to customer:", to, "for restaurant:", restaurantName);
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Your Booking is Confirmed - ${restaurantName}`,
      html: `
      <div style="background-color:#f5f5f7;padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
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
                Your Booking is Confirmed
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                Hi ${customerName}, your table booking at <strong>${restaurantName}</strong> has been confirmed!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <div style="background:#f9fafb;border-radius:12px;padding:16px;">
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Date:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${formattedDate}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Time:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${bookingTime}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Number of Guests:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${guestCount} ${guestCount === 1 ? "Guest" : "Guests"}</span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">
                We look forward to welcoming you! If you need to make any changes, please contact us directly.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `.trim(),
    });
    console.log("[Email] Booking confirmation email sent");
  } catch (error) {
    console.error("[Email] Error sending booking confirmation email:", error);
    throw error;
  }
}

interface SendBookingCancellationEmailOptions {
  to: string;
  restaurantName: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
}

export async function sendBookingCancellationEmail({
  to,
  restaurantName,
  customerName,
  bookingDate,
  bookingTime,
}: SendBookingCancellationEmailOptions) {
  if (!resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping booking cancellation email");
    return;
  }

  const brandName = "DineEasy";
  const formattedDate = new Date(bookingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    console.log("[Email] Sending booking cancellation email to customer:", to, "for restaurant:", restaurantName);
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Your Booking Request Update - ${restaurantName}`,
      html: `
      <div style="background-color:#f5f5f7;padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
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
                Your Booking Request Update
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                Hi ${customerName}, we're sorry to inform you that your booking request for <strong>${restaurantName}</strong> has been cancelled.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <div style="background:#f9fafb;border-radius:12px;padding:16px;">
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Date:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${formattedDate}</span>
                </div>
                <div style="margin-bottom:12px;">
                  <strong style="color:#111827;">Time:</strong>
                  <span style="color:#4b5563;margin-left:8px;">${bookingTime}</span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">
                If you have any questions or would like to make a new booking, please contact us directly. We apologize for any inconvenience.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `.trim(),
    });
    console.log("[Email] Booking cancellation email sent");
  } catch (error) {
    console.error("[Email] Error sending booking cancellation email:", error);
    throw error;
  }
}
