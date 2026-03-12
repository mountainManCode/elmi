// Better-Auth configuration
// Docs: https://better-auth.com
//
// Uses the ZenStack adapter — auth tables are managed by Better-Auth
// directly on the raw `db` client (no access policies applied).
// Run `npx @better-auth/cli generate` after changing plugins to sync the schema.

import { betterAuth } from "better-auth";
import { zenstackAdapter } from "@zenstackhq/better-auth";
import { organization, magicLink } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendMagicLinkEmail, sendInvitationEmail } from "@/lib/email";

export const auth = betterAuth({
  database: zenstackAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    organization({
      sendInvitationEmail: async ({ invitation, inviter, organization }) => {
        const inviteUrl = `${process.env.BETTER_AUTH_URL}/accept-invite?token=${invitation.id}`;
        await sendInvitationEmail({
          to: invitation.email,
          inviterName: inviter.user.name,
          orgName: organization.name,
          inviteUrl,
        });
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ to: email, url });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
