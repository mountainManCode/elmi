// ZenStack enhanced Prisma client
// Import this everywhere — never import @prisma/client directly.
//
// Usage:
//   import { getEnhancedPrisma } from "@/lib/db";
//   const db = await getEnhancedPrisma(); // applies access policies for current user

import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Returns an access-policy-enforced client scoped to the current request user. */
export async function getEnhancedPrisma() {
  const session = await auth.api.getSession({ headers: await headers() });
  return enhance(prisma, { user: session?.user ?? undefined });
}
