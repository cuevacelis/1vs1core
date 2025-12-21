"use client";

interface StatisticsProps {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function Statistics({
  totalMatches,
  wins,
  losses,
  winRate,
}: StatisticsProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Estadísticas</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Partidas Totales</p>
            <p className="text-2xl font-bold text-gray-900">{totalMatches}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Victorias</p>
            <p className="text-2xl font-bold text-green-600">{wins}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Derrotas</p>
            <p className="text-2xl font-bold text-red-600">{losses}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Porcentaje de Victoria</p>
            <p className="text-2xl font-bold text-blue-600">
              {winRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
