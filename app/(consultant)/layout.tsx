import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConsultantShell } from "./_components/consultant-shell";

export default async function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <ConsultantShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </ConsultantShell>
  );
}
