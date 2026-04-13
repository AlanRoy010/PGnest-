import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      listing_id, listing_title, listing_area,
      full_name, email, phone,
      visit_date, visit_time,
      user_id, owner_phone, owner_name,
    } = body;

    // Save to database
    const supabase = await createClient();
    const { error } = await supabase.from("visit_schedules").insert({
      listing_id,
      user_id: user_id || null,
      full_name,
      email,
      phone,
      visit_date,
      visit_time,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format date nicely
    const formattedDate = new Date(visit_date).toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // Build WhatsApp message for owner
    const whatsappMessage = encodeURIComponent(
      `Hi ${owner_name || "there"}, a visit has been scheduled for your PG *${listing_title}* in ${listing_area}.\n\n` +
      `👤 Visitor: ${full_name}\n` +
      `📅 Date: ${formattedDate}\n` +
      `🕐 Time: ${visit_time}\n` +
      `📞 Phone: ${phone}\n\n` +
      `Please confirm with the visitor directly.`
    );

    // Clean owner phone — remove spaces, dashes, + signs
    const cleanOwnerPhone = owner_phone
      ? owner_phone.replace(/[\s\-\+]/g, "")
      : null;

    const whatsappLink = cleanOwnerPhone
      ? `https://wa.me/${cleanOwnerPhone}?text=${whatsappMessage}`
      : null;

    // Email to visitor
    await resend.emails.send({
      from: "PG Owns <noreply@pgowns.in>",
      to: email,
      subject: `Visit confirmed — ${listing_title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: #ea6c0a; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visit Confirmed! 🎉</h1>
          </div>
          <p style="color: #57534e;">Hi <strong>${full_name}</strong>,</p>
          <p style="color: #57534e;">Your visit has been scheduled. Here are your details:</p>
          <div style="background: #fff7ed; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #c2410c; font-weight: bold; margin: 0 0 12px 0; font-size: 16px;">${listing_title}</p>
            <p style="color: #57534e; margin: 6px 0;">📍 ${listing_area}, Mumbai</p>
            <p style="color: #57534e; margin: 6px 0;">📅 ${formattedDate}</p>
            <p style="color: #57534e; margin: 6px 0;">🕐 ${visit_time}</p>
          </div>
          <p style="color: #57534e;">Our team will share the exact address before your visit. If you need to reschedule, please contact us.</p>
          <p style="color: #a8a29e; font-size: 12px; margin-top: 32px;">— Team PG Owns</p>
        </div>
      `,
    });

    // Email to admin
    await resend.emails.send({
      from: "PG Owns <noreply@pgowns.in>",
      to: process.env.ADMIN_EMAIL!,
      subject: `New visit — ${listing_title} — ${formattedDate} ${visit_time}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: #1c1917; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">New Visit Scheduled 📅</h1>
          </div>

          <h3 style="color: #1c1917;">Property</h3>
          <p style="color: #57534e; margin: 4px 0;"><strong>${listing_title}</strong></p>
          <p style="color: #57534e; margin: 4px 0;">📍 ${listing_area}, Mumbai</p>

          <h3 style="color: #1c1917; margin-top: 20px;">Visit Details</h3>
          <p style="color: #57534e; margin: 4px 0;">📅 ${formattedDate}</p>
          <p style="color: #57534e; margin: 4px 0;">🕐 ${visit_time}</p>

          <h3 style="color: #1c1917; margin-top: 20px;">Visitor Details</h3>
          <p style="color: #57534e; margin: 4px 0;">👤 ${full_name}</p>
          <p style="color: #57534e; margin: 4px 0;">📞 ${phone}</p>
          <p style="color: #57534e; margin: 4px 0;">✉️ ${email}</p>

          <h3 style="color: #1c1917; margin-top: 20px;">Owner Details</h3>
          <p style="color: #57534e; margin: 4px 0;">👤 ${owner_name || "N/A"}</p>
          <p style="color: #57534e; margin: 4px 0;">📞 ${owner_phone || "N/A"}</p>

          ${whatsappLink ? `
          <div style="margin-top: 24px; text-align: center;">
            <a href="${whatsappLink}"
              style="display: inline-block; background: #25D366; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
              💬 Message Owner on WhatsApp
            </a>
            <p style="color: #a8a29e; font-size: 12px; margin-top: 8px;">
              Click to open WhatsApp with a pre-filled message to the owner
            </p>
          </div>
          ` : `
          <p style="color: #ef4444; margin-top: 16px;">⚠️ No owner phone number available for WhatsApp.</p>
          `}
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Visit API error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}