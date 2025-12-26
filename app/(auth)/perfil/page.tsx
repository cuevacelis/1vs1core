import { User } from "lucide-react";
import { ProfileInformation } from "./_components/profile-information/profile-information";
import { Statistics } from "./_components/statistics/statistics";

export default function Profile() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        </div>
        <p className="text-muted-foreground">
          Administra tu información personal y consulta tus estadísticas
        </p>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Information - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ProfileInformation />
        </div>

        {/* Statistics - Takes 1 column */}
        <div className="lg:col-span-1">
          <Statistics />
        </div>
      </div>
    </div>
  );
}
