import { z } from "zod";

// sendOtpEmail: Sends a 6-digit OTP to a tenant's email via Resend API.
// Resend is free (3000 emails/month), works instantly with no recipient activation.
// Sign up at https://resend.com → get your API key → add VITE_RESEND_API_KEY to .env
//
// FALLBACK: If VITE_RESEND_API_KEY is not set, OTP is logged to console and
// displayed visibly on screen so development still works without email setup.

const OtpEmailSchema = z.object({
  toEmail: z.string().email(),
  tenantName: z.string(),
  otp: z.string().length(6),
  rentAmount: z.number(),
  unit: z.string()
});

type OtpEmailInput = z.infer<typeof OtpEmailSchema>;

export async function sendOtpEmail(input: OtpEmailInput) {
  const data = OtpEmailSchema.parse(input);
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

  // If no API key is configured, return fallback (dev mode)
  if (!resendApiKey) {
    console.warn("⚠️  VITE_RESEND_API_KEY not set in .env");
    console.log(`📧 [DEV MODE] OTP for ${data.toEmail}: ${data.otp}`);
    return {
      success: false,
      devMode: true,
      otp: data.otp, // Returned so UI can show it visibly
      message: "VITE_RESEND_API_KEY not configured. Add it to .env to enable real emails."
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "RentHub Security <onboarding@resend.dev>",
        to: [data.toEmail],
        subject: `RentHub OTP: ${data.otp} — Verify Your Rent Payment`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 20px 24px; border-radius: 8px; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 800;">🔐 RentHub</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Secure Payment Verification</p>
            </div>

            <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hello <strong>${data.tenantName}</strong>,</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Your one-time security code (OTP) for rent payment of
              <strong style="color: #111827;">₹${data.rentAmount.toLocaleString()}</strong>
              for Unit <strong style="color: #111827;">${data.unit}</strong> is:
            </p>

            <div style="background: white; border: 2px dashed #0d9488; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
              <p style="margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #0d9488; font-family: monospace;">${data.otp}</p>
            </div>

            <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0 0 8px;">
              ⏱ This OTP is valid for <strong>5 minutes</strong> only.
            </p>
            <p style="color: #ef4444; font-size: 12px; line-height: 1.6; margin: 0;">
              🚨 If you did not initiate this payment, please ignore this email and contact your landlord immediately.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">This is an automated security email from RentHub. Do not reply.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend API error:", errText);
      return {
        success: false,
        devMode: false,
        otp: data.otp, // Still return OTP as fallback
        message: `Email service error: ${errText}`
      };
    }

    return {
      success: true,
      devMode: false,
      message: `OTP sent to ${data.toEmail}`
    };
  } catch (err: any) {
    console.error("sendOtpEmail error:", err);
    return {
      success: false,
      devMode: true,
      otp: data.otp,
      message: err.message || "Failed to dispatch OTP email."
    };
  }
}
