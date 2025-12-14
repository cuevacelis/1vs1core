"use client";

import { use } from "react";
import Link from "next/link";

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/torneo"
            className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Tournaments
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Tournament Details
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="aspect-video bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-gray-400">Tournament Banner</span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Tournament Name #{id}
                </h2>

                <div className="prose max-w-none">
                  <p className="text-gray-600">
                    Tournament description will be displayed here.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Matches</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <p className="text-gray-500">No matches scheduled yet</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tournament Info
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd className="text-sm font-medium text-green-600">Active</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Game</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    League of Legends
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Participants</dt>
                  <dd className="text-sm font-medium text-gray-900">0 / 32</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Start Date</dt>
                  <dd className="text-sm font-medium text-gray-900">TBD</dd>
                </div>
              </dl>

              <button className="w-full mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Join Tournament
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Participants
              </h3>
              <div className="space-y-3">
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No participants yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
