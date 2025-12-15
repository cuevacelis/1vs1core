"use client";

import { useUserMatchStatisticsQuery } from "./_components/services/use-user-match-statistics.query";
import { useUserProfileQuery } from "./_components/services/use-user-profile.query";

export default function Profile() {
  const { data: profile, isLoading: isLoadingProfile } = useUserProfileQuery();
  const { data: stats, isLoading: isLoadingStats } =
    useUserMatchStatisticsQuery();

  if (isLoadingProfile || isLoadingStats) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.person?.first_name && profile?.person?.paternal_last_name
      ? `${profile.person.first_name} ${profile.person.paternal_last_name}`
      : profile?.name || "User Name";
  const shortName = profile?.short_name || "";
  const firstInitial =
    profile?.person?.first_name?.[0] || profile?.name?.[0] || "U";
  const roles =
    profile?.roles?.map((r: { name: string }) => r.name).join(", ") || "Player";
  const isActive = profile?.state === "active";

  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Information
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                {firstInitial}
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {displayName}
                </h3>
                <p className="text-gray-600">{roles}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="display-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="display-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your display name"
                  value={displayName}
                  disabled
                />
              </div>

              <div>
                <label
                  htmlFor="short-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Short Name
                </label>
                <input
                  type="text"
                  id="short-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your short name"
                  value={shortName}
                  disabled
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <span
                  id="status"
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Statistics</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalMatches}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Wins</p>
                <p className="text-2xl font-bold text-green-600">{wins}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Losses</p>
                <p className="text-2xl font-bold text-red-600">{losses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {winRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
