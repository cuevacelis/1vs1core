"use client";

import { use, useState, useEffect } from "react";
import { useWebSocket } from "@/lib/websocket/client";

export default function AdminMatchViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const matchId = parseInt(id);

  const [matchData, setMatchData] = useState<any>(null);
  const [player1Selection, setPlayer1Selection] = useState<any>(null);
  const [player2Selection, setPlayer2Selection] = useState<any>(null);
  const [player1Locked, setPlayer1Locked] = useState(false);
  const [player2Locked, setPlayer2Locked] = useState(false);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const { isConnected, lastMessage, subscribe } = useWebSocket(wsUrl);

  useEffect(() => {
    // Fetch match data
    const mockMatch = {
      id: matchId,
      player1_id: 1,
      player1_name: "Player 1",
      player1_url_image: null,
      player2_id: 2,
      player2_name: "Player 2",
      player2_url_image: null,
      tournament_name: "Sample Tournament",
      status: "in_selection",
    };
    setMatchData(mockMatch);
  }, [matchId]);

  useEffect(() => {
    if (matchData && isConnected) {
      subscribe(matchData.id, undefined, true);
    }
  }, [matchData, isConnected, subscribe]);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "champion_selected":
          if (lastMessage.playerId === matchData?.player1_id) {
            setPlayer1Selection({
              championId: lastMessage.championId,
              championName: lastMessage.data?.championName || "Unknown",
            });
          } else if (lastMessage.playerId === matchData?.player2_id) {
            setPlayer2Selection({
              championId: lastMessage.championId,
              championName: lastMessage.data?.championName || "Unknown",
            });
          }
          break;

        case "champion_locked":
          if (lastMessage.playerId === matchData?.player1_id) {
            setPlayer1Locked(true);
          } else if (lastMessage.playerId === matchData?.player2_id) {
            setPlayer2Locked(true);
          }
          break;
      }
    }
  }, [lastMessage, matchData]);

  if (!matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading match data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-black bg-opacity-60 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {matchData.tournament_name}
                </h1>
                <p className="text-xl text-purple-300">Match #{matchId}</p>
              </div>
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <div className="flex items-center text-green-400">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </div>
                ) : (
                  <div className="flex items-center text-red-400">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    Disconnected
                  </div>
                )}
                <span className="text-gray-400 text-sm">Admin View</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Player 1 */}
          <div className="bg-black bg-opacity-60 rounded-lg p-8 backdrop-blur-sm border-4 border-blue-500">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {matchData.player1_name.charAt(0)}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {matchData.player1_name}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-sm">
                Player 1
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                Champion Selection
              </h3>

              {player1Selection ? (
                <div>
                  <div className="aspect-square bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-9xl">🎮</span>
                  </div>
                  <p className="text-white text-2xl font-bold text-center mb-4">
                    {player1Selection.championName}
                  </p>
                  {player1Locked ? (
                    <div className="bg-green-600 text-white py-3 rounded-lg text-center font-bold flex items-center justify-center">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      LOCKED IN
                    </div>
                  ) : (
                    <div className="bg-yellow-600 text-white py-3 rounded-lg text-center font-bold animate-pulse">
                      Selecting...
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500 text-xl text-center px-4">
                    Waiting for selection...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div className="bg-black bg-opacity-60 rounded-lg p-8 backdrop-blur-sm border-4 border-red-500">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {matchData.player2_name.charAt(0)}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {matchData.player2_name}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-sm">
                Player 2
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                Champion Selection
              </h3>

              {player2Selection ? (
                <div>
                  <div className="aspect-square bg-gradient-to-br from-red-600 to-red-800 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-9xl">🎮</span>
                  </div>
                  <p className="text-white text-2xl font-bold text-center mb-4">
                    {player2Selection.championName}
                  </p>
                  {player2Locked ? (
                    <div className="bg-green-600 text-white py-3 rounded-lg text-center font-bold flex items-center justify-center">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      LOCKED IN
                    </div>
                  ) : (
                    <div className="bg-yellow-600 text-white py-3 rounded-lg text-center font-bold animate-pulse">
                      Selecting...
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500 text-xl text-center px-4">
                    Waiting for selection...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {player1Locked && player2Locked && (
          <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Both Players Locked In!
            </h2>
            <p className="text-xl text-white mb-6">Ready to start the match</p>
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
              Start Match
            </button>
          </div>
        )}

        <div className="mt-8 bg-black bg-opacity-60 rounded-lg p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4">
            Match Controls
          </h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Pause Timer
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Reset Selections
            </button>
            <button className="bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Cancel Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
