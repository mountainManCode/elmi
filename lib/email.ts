// Email delivery via Resend
// RESEND_API_KEY and RESEND_FROM_EMAIL must be set in .env.local

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM_EMAIL ?? "noreply@elmi.app";

export async function sendMagicLinkEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  await resend.emails.send({
    from,
    to,
    subject: "Your sign-in link for Elmi",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111">Sign in to Elmi</h2>
        <p style="margin:0 0 24px;color:#555;font-size:14px">Click the button below to sign in. This link expires in 15 minutes.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2f9e44;color:white;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">Sign in</a>
        <p style="margin:24px 0 0;color:#999;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendInvitationEmail({
  to,
  inviterName,
  orgName,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  orgName: string;
  inviteUrl: string;
}) {
  await resend.emails.send({
    from,
    to,
    subject: `${inviterName} invited you to join ${orgName} on Elmi`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111">You're invited to ${orgName}</h2>
        <p style="margin:0 0 24px;color:#555;font-size:14px">
          <strong>${inviterName}</strong> has invited you to join their team on Elmi.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2f9e44;color:white;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">Accept invitation</a>
        <p style="margin:24px 0 0;color:#999;font-size:12px">This invitation expires in 48 hours. If you weren't expecting this, you can safely ignore it.</p>
      </div>
    `,
  });
}
