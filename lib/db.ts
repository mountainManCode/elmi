// ZenStack v3 database client
// Import `getUserDb` in Server Components and Server Actions — never use `db` directly in app code.
// `db` (raw, no policies) is reserved for Better-Auth internals.
//
// Usage in Server Components / Server Actions:
//   const db = await getUserDb();
//   const projects = await db.project.findMany();

import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { PolicyPlugin } from "@zenstackhq/plugin-policy";
import { schema } from "@/zenstack/schema";
import { Pool } from "@neondatabase/serverless";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Connection pool — shared across the Node.js process lifetime
// ---------------------------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------------------------------------------------------------
// Base client — NO access control policies applied.
// Used by Better-Auth adapter only. Do NOT use in application code.
// ---------------------------------------------------------------------------
export const db = new ZenStackClient(schema, {
  dialect: new PostgresDialect({ pool }),
});

// ---------------------------------------------------------------------------
// Policy-enforced client — access control enabled, but no user context yet.
// Call $setAuth(user) to bind a user before querying.
// ---------------------------------------------------------------------------
export const authDb = db.$use(new PolicyPlugin());

// ---------------------------------------------------------------------------
// Per-request user-bound client — use this everywhere in app code.
// Automatically scopes all queries to the current session user.
// ---------------------------------------------------------------------------
export async function getUserDb() {
  // Dynamic import breaks the circular dep: lib/auth.ts → lib/db.ts → lib/auth.ts
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: await headers() });
  return authDb.$setAuth(session?.user ?? undefined);
}
