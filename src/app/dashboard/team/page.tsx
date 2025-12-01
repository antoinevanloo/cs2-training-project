'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryRadarChart } from '@/components/charts';
import {
  Users,
  Upload,
  Plus,
  X,
  Shield,
  Target,
  Crosshair,
  Eye,
  Zap,
  Crown,
  AlertTriangle,
  Check,
  Loader2,
  TrendingUp,
  ArrowRight,
  Map,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryStyle, getScoreColor, CATEGORY_ORDER } from '@/lib/design/tokens';

// Role definitions
const PLAYER_ROLES = [
  { id: 'entry', name: 'Entry Fragger', icon: Zap, color: 'text-red-400', description: 'Premier sur site' },
  { id: 'support', name: 'Support', icon: Shield, color: 'text-blue-400', description: 'Utilitaires et trades' },
  { id: 'awp', name: 'AWPer', icon: Crosshair, color: 'text-green-400', description: 'Sniper principal' },
  { id: 'lurk', name: 'Lurker', icon: Eye, color: 'text-purple-400', description: 'Rotations et flanks' },
  { id: 'igl', name: 'IGL', icon: Crown, color: 'text-yellow-400', description: 'Leader tactique' },
];

interface TeamMember {
  id: string;
  name: string;
  steamId?: string;
  role: string | null;
  demoCount: number;
  avgRating: number;
  avgAdr: number;
  scores: Record<string, number>;
}

interface TeamSynergy {
  player1: string;
  player2: string;
  synergyScore: number;
  tradeRate: number;
  flashAssistRate: number;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [synergies, setSynergies] = useState<TeamSynergy[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedDemos, setUploadedDemos] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleUploadDemos = useCallback(() => {
    // Would trigger file upload
    const mockDemos = ['demo1.dem', 'demo2.dem', 'demo3.dem'];
    setUploadedDemos(mockDemos);
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock team data
    setTeamMembers([
      {
        id: '1',
        name: 'Player1',
        role: 'entry',
        demoCount: 3,
        avgRating: 1.25,
        avgAdr: 85.4,
        scores: { aim: 78, positioning: 65, utility: 55, economy: 70, timing: 72, decision: 68, movement: 75, awareness: 60, teamplay: 82 },
      },
      {
        id: '2',
        name: 'Player2',
        role: 'awp',
        demoCount: 3,
        avgRating: 1.15,
        avgAdr: 72.3,
        scores: { aim: 82, positioning: 70, utility: 45, economy: 65, timing: 68, decision: 72, movement: 55, awareness: 75, teamplay: 60 },
      },
      {
        id: '3',
        name: 'Player3',
        role: 'support',
        demoCount: 3,
        avgRating: 1.05,
        avgAdr: 68.2,
        scores: { aim: 62, positioning: 72, utility: 85, economy: 78, timing: 65, decision: 70, movement: 60, awareness: 72, teamplay: 88 },
      },
      {
        id: '4',
        name: 'Player4',
        role: 'lurk',
        demoCount: 3,
        avgRating: 1.10,
        avgAdr: 70.5,
        scores: { aim: 70, positioning: 80, utility: 52, economy: 68, timing: 78, decision: 75, movement: 72, awareness: 82, teamplay: 55 },
      },
      {
        id: '5',
        name: 'Player5',
        role: 'igl',
        demoCount: 3,
        avgRating: 0.98,
        avgAdr: 62.1,
        scores: { aim: 58, positioning: 75, utility: 72, economy: 85, timing: 70, decision: 88, movement: 55, awareness: 78, teamplay: 80 },
      },
    ]);

    setSynergies([
      { player1: 'Player1', player2: 'Player3', synergyScore: 85, tradeRate: 72, flashAssistRate: 45 },
      { player1: 'Player2', player2: 'Player4', synergyScore: 78, tradeRate: 65, flashAssistRate: 38 },
      { player1: 'Player1', player2: 'Player5', synergyScore: 70, tradeRate: 58, flashAssistRate: 52 },
    ]);

    setIsAnalyzing(false);
    setAnalysisComplete(true);
  }, []);

  const updatePlayerRole = (playerId: string, role: string) => {
    setTeamMembers(prev =>
      prev.map(p => p.id === playerId ? { ...p, role } : p)
    );
  };

  // Calculate team averages
  const teamAverages = teamMembers.length > 0 ? {
    rating: teamMembers.reduce((sum, m) => sum + m.avgRating, 0) / teamMembers.length,
    adr: teamMembers.reduce((sum, m) => sum + m.avgAdr, 0) / teamMembers.length,
    scores: CATEGORY_ORDER.reduce((acc, cat) => {
      acc[cat] = teamMembers.reduce((sum, m) => sum + (m.scores[cat] || 0), 0) / teamMembers.length;
      return acc;
    }, {} as Record<string, number>),
  } : null;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-cs2-accent" />
            <h1 className="text-2xl font-bold text-white">Analyse d'Équipe</h1>
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
              TEAM
            </span>
          </div>
          <p className="text-gray-400 mt-1">Analyse les synergies et performances de ton équipe</p>
        </div>
      </div>

      {/* Upload Section */}
      {!analysisComplete && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload des démos
            </CardTitle>
          </CardHeader>

          <p className="text-gray-400 text-sm mb-4">
            Upload jusqu'à 5 démos du même match avec les perspectives de chaque joueur
          </p>

          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
            <Upload className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 mb-4">
              Glisse-dépose tes fichiers .dem ici ou
            </p>
            <Button onClick={handleUploadDemos} className="gap-2">
              <Plus className="w-4 h-4" />
              Sélectionner des fichiers
            </Button>
          </div>

          {/* Uploaded files list */}
          {uploadedDemos.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">{uploadedDemos.length} fichiers sélectionnés</p>
              {uploadedDemos.map((demo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                >
                  <span className="text-sm text-white">{demo}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedDemos(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-4 gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analyser l'équipe
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Analysis Results */}
      {analysisComplete && teamMembers.length > 0 && (
        <>
          {/* Team Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Stats */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Stats Équipe</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rating moyen</span>
                  <span className="text-xl font-bold text-white">
                    {teamAverages?.rating.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ADR moyen</span>
                  <span className="text-xl font-bold text-white">
                    {teamAverages?.adr.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Joueurs</span>
                  <span className="text-xl font-bold text-white">
                    {teamMembers.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Démos analysées</span>
                  <span className="text-xl font-bold text-white">
                    {uploadedDemos.length}
                  </span>
                </div>
              </div>
            </Card>

            {/* Team Radar */}
            <Card className="p-6 lg:col-span-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Profil d'équipe</CardTitle>
              </CardHeader>
              <div className="flex justify-center">
                <CategoryRadarChart
                  scores={teamAverages?.scores || {}}
                  size={280}
                  showLabels
                  showValues
                />
              </div>
            </Card>
          </div>

          {/* Players Grid */}
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Joueurs ({teamMembers.length})
              </CardTitle>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => {
                const role = PLAYER_ROLES.find(r => r.id === member.role);
                const RoleIcon = role?.icon || Users;

                return (
                  <Card key={member.id} className="p-4 bg-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{member.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <RoleIcon className={cn('w-4 h-4', role?.color || 'text-gray-400')} />
                          <span className={cn('text-sm', role?.color || 'text-gray-400')}>
                            {role?.name || 'Non assigné'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{member.avgRating.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {PLAYER_ROLES.map((r) => {
                        const Icon = r.icon;
                        const isSelected = member.role === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => updatePlayerRole(member.id, r.id)}
                            className={cn(
                              'p-1.5 rounded transition-colors',
                              isSelected
                                ? 'bg-gray-700 ring-1 ring-gray-500'
                                : 'hover:bg-gray-700/50'
                            )}
                            title={r.name}
                          >
                            <Icon className={cn('w-4 h-4', r.color)} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-1.5 bg-gray-900/50 rounded">
                        <div className="text-white font-medium">{member.avgAdr.toFixed(0)}</div>
                        <div className="text-gray-500">ADR</div>
                      </div>
                      <div className="p-1.5 bg-gray-900/50 rounded">
                        <div className="text-white font-medium">{member.scores.aim}</div>
                        <div className="text-gray-500">Aim</div>
                      </div>
                      <div className="p-1.5 bg-gray-900/50 rounded">
                        <div className="text-white font-medium">{member.scores.teamplay}</div>
                        <div className="text-gray-500">Team</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Synergies */}
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Synergies
              </CardTitle>
            </CardHeader>

            <div className="space-y-3">
              {synergies.map((synergy, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-white font-medium">{synergy.player1}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="text-white font-medium">{synergy.player2}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div
                        className="font-bold"
                        style={{ color: getScoreColor(synergy.synergyScore) }}
                      >
                        {synergy.synergyScore}
                      </div>
                      <div className="text-gray-500 text-xs">Synergie</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{synergy.tradeRate}%</div>
                      <div className="text-gray-500 text-xs">Trade Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{synergy.flashAssistRate}%</div>
                      <div className="text-gray-500 text-xs">Flash Assist</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6 border-cs2-accent/30">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-cs2-accent" />
                Recommandations
              </CardTitle>
            </CardHeader>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Overlap de positions</h4>
                  <p className="text-gray-400 text-sm">
                    Player2 et Player4 se retrouvent souvent aux mêmes positions. Définir des zones de responsabilité.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Check className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Excellente coordination Entry-Support</h4>
                  <p className="text-gray-400 text-sm">
                    Player1 et Player3 ont un taux de trade de 72%. Continuez sur cette lancée !
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Target className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Utiliser plus de flashs</h4>
                  <p className="text-gray-400 text-sm">
                    Le taux de flash assist de l'équipe est de 42%. L'objectif devrait être 55%+.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Reset button */}
          <div className="text-center">
            <Button
              variant="secondary"
              onClick={() => {
                setAnalysisComplete(false);
                setTeamMembers([]);
                setSynergies([]);
                setUploadedDemos([]);
              }}
            >
              Nouvelle analyse
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
