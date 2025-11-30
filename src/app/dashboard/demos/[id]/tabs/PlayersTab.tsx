'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users } from 'lucide-react';

// NOTE: These types are copied from DemoDetailClient.tsx.
// They should be moved to a shared types file.
interface PlayerStats {
  id: string;
  playerName: string;
  steamId: string;
  teamNumber: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  headshotPercentage: number;
  adr: number;
  kast: number;
  rating: number;
  entryKills: number;
  entryDeaths: number;
  clutchesWon: number;
  clutchesLost: number;
  isMainPlayer: boolean;
}

interface DemoData {
    playerStats: PlayerStats[];
    status: string;
}

interface PlayersTabProps {
  demo: DemoData;
}

export function PlayersTab({ demo }: PlayersTabProps) {
  const isProcessing = ['PENDING', 'QUEUED', 'PROCESSING', 'ANALYZING'].includes(demo.status);

  if (demo.playerStats.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400 mb-2">Aucune donnée de joueur</p>
        {isProcessing && (
          <p className="text-sm text-gray-500">
            Les données seront disponibles une fois le traitement terminé.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
      <CardHeader>
        <CardTitle>Tous les joueurs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3 font-medium">Joueur</th>
                <th className="pb-3 font-medium text-center">K</th>
                <th className="pb-3 font-medium text-center">D</th>
                <th className="pb-3 font-medium text-center">A</th>
                <th className="pb-3 font-medium text-center">ADR</th>
                <th className="pb-3 font-medium text-center">HS%</th>
                <th className="pb-3 font-medium text-center">KAST</th>
                <th className="pb-3 font-medium text-center">Rating</th>
              </tr>
            </thead>
            <tbody>
              {demo.playerStats
                .sort((a, b) => b.rating - a.rating)
                .map((player) => (
                  <tr
                    key={player.id}
                    className={`border-b border-gray-800 ${
                      player.isMainPlayer ? 'bg-cs2-accent/10' : ''
                    }`}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{player.playerName}</span>
                        {player.isMainPlayer && (
                          <span className="text-xs bg-cs2-accent/20 text-cs2-accent px-2 py-0.5 rounded">
                            Vous
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center text-white">{player.kills}</td>
                    <td className="py-3 text-center text-white">{player.deaths}</td>
                    <td className="py-3 text-center text-white">{player.assists}</td>
                    <td className="py-3 text-center text-white">{Math.round(player.adr)}</td>
                    <td className="py-3 text-center text-white">{Math.round(player.headshotPercentage)}%</td>
                    <td className="py-3 text-center text-white">{Math.round(player.kast)}%</td>
                    <td className="py-3 text-center font-medium text-cs2-accent">
                      {player.rating.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
