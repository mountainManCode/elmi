// Better-Auth configuration
// Docs: https://better-auth.com

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
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
