import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveMatch } from "./_components/active-match/active-match";
import { DashboardHeader } from "./_components/dashboard-header/dashboard-header";
import { MyTournaments } from "./_components/my-tournaments/my-tournaments";
import { QuickStats } from "./_components/quick-stats/quick-stats";
import { RecentMatches } from "./_components/recent-matches/recent-matches";
import { StatsCards } from "./_components/stats-cards/stats-cards";

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <DashboardHeader />

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Active Match - Takes 2 columns on xl screens */}
        <ActiveMatch />

        {/* Quick Stats */}
        <QuickStats />
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="matches" className="w-full">
        <TabsList>
          <TabsTrigger value="matches">Partidas Recientes</TabsTrigger>
          <TabsTrigger value="tournaments">Mis Torneos</TabsTrigger>
        </TabsList>
        <TabsContent value="matches" className="space-y-4">
          <RecentMatches />
        </TabsContent>
        <TabsContent value="tournaments" className="space-y-4">
          <MyTournaments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
