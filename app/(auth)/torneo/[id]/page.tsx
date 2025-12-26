import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { TournamentDetail } from "./_components/tournament-detail/tournament-detail";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const tournamentId = parseInt(id, 10);

  if (Number.isNaN(tournamentId)) {
    redirect("/torneo");
  }

  return (
    <TournamentDetail
      tournamentId={tournamentId}
      currentUserId={session.userId}
    />
  );
}
