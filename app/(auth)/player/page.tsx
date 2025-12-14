"use client";

import {
  Check,
  Clock,
  Loader2,
  Search,
  Trophy,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useWebSocket } from "@/lib/websocket/client";

export default function PlayerMatchPage() {
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [champions, setChampions] = useState<any[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const {
    isConnected,
    lastMessage,
    subscribe,
    sendChampionSelected,
    sendChampionLocked,
  } = useWebSocket(wsUrl);

  useEffect(() => {
    // Fetch active match
    // This would be replaced with actual API call
    const mockMatch = {
      id: 1,
      player1_name: "Player 1",
      player2_name: "Player 2",
      tournament_name: "Sample Tournament",
    };
    setActiveMatch(mockMatch);

    // Mock champions data
    const mockChampions = [
      { id: 1, name: "Ahri", url_image: null },
      { id: 2, name: "Yasuo", url_image: null },
      { id: 3, name: "Zed", url_image: null },
      { id: 4, name: "Lee Sin", url_image: null },
      { id: 5, name: "Thresh", url_image: null },
      { id: 6, name: "Jinx", url_image: null },
      { id: 7, name: "Lux", url_image: null },
      { id: 8, name: "Ezreal", url_image: null },
    ];
    setChampions(mockChampions);
  }, []);

  useEffect(() => {
    if (activeMatch && isConnected) {
      subscribe(activeMatch.id, 1, false);
    }
  }, [activeMatch, isConnected, subscribe]);

  useEffect(() => {
    if (timeRemaining > 0 && !isLocked) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, isLocked]);

  const handleChampionSelect = (championId: number) => {
    if (!isLocked && activeMatch) {
      setSelectedChampion(championId);
      sendChampionSelected(activeMatch.id, 1, championId);
    }
  };

  const handleLockIn = () => {
    if (selectedChampion && activeMatch && !isLocked) {
      setIsLocked(true);
      sendChampionLocked(activeMatch.id, 1, selectedChampion);
    }
  };

  const filteredChampions = champions.filter((champion) =>
    champion.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!activeMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted">
        <Card className="w-96 border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Esperando partida...</h2>
              <p className="text-muted-foreground">
                Serás redirigido cuando tu partida esté lista
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Match Header */}
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl font-bold">
                    {activeMatch.tournament_name}
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  {activeMatch.player1_name} vs {activeMatch.player2_name}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-4xl font-bold tabular-nums">
                    {Math.floor(timeRemaining / 60)}:
                    {(timeRemaining % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="gap-1"
                >
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      Desconectado
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Champions Grid */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Selecciona tu Campeón
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar campeones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLocked}
                    className="pl-10 h-11"
                  />
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredChampions.map((champion) => (
                    <button
                      key={champion.id}
                      type="button"
                      onClick={() => handleChampionSelect(champion.id)}
                      disabled={isLocked}
                      className={`
                        group relative p-4 rounded-lg transition-all duration-200 border-2
                        ${
                          selectedChampion === champion.id
                            ? "border-primary bg-primary/10 shadow-lg scale-105"
                            : "border-border hover:border-primary/50 hover:bg-muted"
                        }
                        ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {selectedChampion === champion.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                        <span className="text-4xl">🎮</span>
                      </div>
                      <p className="text-sm font-medium text-center truncate">
                        {champion.name}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selection Panel */}
          <div>
            <Card className="border-2 sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl">Tu Selección</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                {selectedChampion ? (
                  <div>
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                      <span className="text-8xl">🎮</span>
                    </div>
                    <h3 className="text-2xl font-bold text-center mb-2">
                      {champions.find((c) => c.id === selectedChampion)?.name}
                    </h3>
                  </div>
                ) : (
                  <div>
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <p className="text-muted-foreground text-center px-4">
                        Selecciona un campeón
                      </p>
                    </div>
                  </div>
                )}

                {isLocked ? (
                  <div className="bg-green-500/10 border-2 border-green-500 text-green-700 dark:text-green-400 py-4 rounded-lg text-center font-bold flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Confirmado
                  </div>
                ) : (
                  <Button
                    onClick={handleLockIn}
                    disabled={!selectedChampion}
                    className="w-full h-12 text-lg font-bold"
                    size="lg"
                  >
                    Confirmar Campeón
                  </Button>
                )}

                <p className="text-muted-foreground text-sm text-center">
                  {isLocked
                    ? "Esperando al oponente..."
                    : "Selecciona y confirma tu campeón"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
