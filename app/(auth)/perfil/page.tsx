"use client";

import { ProfileInformation } from "./_components/profile-information";
import { useUserMatchStatisticsQuery } from "./_components/services/use-user-match-statistics.query";
import { useUserProfileQuery } from "./_components/services/use-user-profile.query";
import { Statistics } from "./_components/statistics";

export default function Profile() {
  const { data: profile, isLoading: isLoadingProfile } = useUserProfileQuery();
  const { data: stats, isLoading: isLoadingStats } =
    useUserMatchStatisticsQuery();

  if (isLoadingProfile || isLoadingStats) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.person?.first_name && profile?.person?.paternal_last_name
      ? `${profile.person.first_name} ${profile.person.paternal_last_name}`
      : profile?.name || "Nombre de Usuario";
  const shortName = profile?.short_name || "";
  const firstInitial =
    profile?.person?.first_name?.[0] || profile?.name?.[0] || "U";
  const roleName = profile?.role?.name || "Jugador";
  const isActive = profile?.state === "active";

  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

        <ProfileInformation
          displayName={displayName}
          shortName={shortName}
          firstInitial={firstInitial}
          role={roleName}
          isActive={isActive}
        />

        <div className="mt-8">
          <Statistics
            totalMatches={totalMatches}
            wins={wins}
            losses={losses}
            winRate={winRate}
          />
        </div>
      </div>
    </div>
  );
}
