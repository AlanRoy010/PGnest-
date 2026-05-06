import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Rate limit: max 3 OTP requests per email per 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_otps")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", fiveMinutesAgo);

    if (count !== null && count >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before requesting another code." },
        { status: 429 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase.from("email_otps").insert({
      email,
      otp: otpHash,
      expires_at: expiresAt,
    });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const { error: emailError } = await resend.emails.send({
      from: "PG Owns <noreply@pgowns.in>",
      to: email,
      subject: "Your PG Owns verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1c1917; margin-bottom: 8px;">Verify your email</h2>
          <p style="color: #78716c; margin-bottom: 24px;">Enter this code in PG Owns to complete your sign up. It expires in 10 minutes.</p>
          <div style="background: #fff7ed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 0.2em; color: #ea6c0a;">${otp}</span>
          </div>
          <p style="color: #a8a29e; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
