"use client";

interface ProfileInformationProps {
  displayName: string;
  shortName: string;
  firstInitial: string;
  roles: string;
  isActive: boolean;
}

export function ProfileInformation({
  displayName,
  shortName,
  firstInitial,
  roles,
  isActive,
}: ProfileInformationProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Información del Perfil
        </h2>
      </div>

      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-3xl font-bold">
            {firstInitial}
          </div>
          <div className="ml-6">
            <h3 className="text-2xl font-bold text-gray-900">{displayName}</h3>
            <p className="text-gray-600">{roles}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre completo
            </label>
            <input
              type="text"
              id="display-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre completo"
              value={displayName}
              disabled
            />
          </div>

          <div>
            <label
              htmlFor="short-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre corto
            </label>
            <input
              type="text"
              id="short-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre corto"
              value={shortName}
              disabled
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Estado
            </label>
            <span
              id="status"
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
