// Accept Invitation — public page (outside consultant shell)
// Flow: check session → fetch invitation → show accept/decline UI

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AcceptInviteView } from "./_components/accept-invite-view";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/sign-in");
  }

  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  if (!session) {
    redirect(`/sign-in?redirect=/accept-invite?token=${token}`);
  }

  let invitation = null;
  try {
    invitation = await auth.api.getInvitation({
      query: { id: token },
      headers: hdrs,
    });
  } catch {
    // invitation not found or expired — invitation stays null
  }

  if (!invitation) {
    return (
      <AcceptInviteView
        error="This invitation link is invalid or has expired."
        userEmail={session.user.email}
      />
    );
  }

  if (invitation.status !== "pending") {
    return (
      <AcceptInviteView
        error={`This invitation has already been ${invitation.status}.`}
        userEmail={session.user.email}
      />
    );
  }

  return (
    <AcceptInviteView
      invitation={{
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organizationName,
        inviterEmail: invitation.inviterEmail,
        expiresAt: invitation.expiresAt,
      }}
      userEmail={session.user.email}
    />
  );
}
