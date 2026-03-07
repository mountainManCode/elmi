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

export const auth = betterAuth({
  database: zenstackAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    organization(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: wire up email provider (Resend / SendGrid)
        console.log(`Magic link for ${email}: ${url}`);
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
