import { requireAuth } from '@/lib/auth/utils';
import { getAnalysisByDemoId } from '@/lib/db/queries/analyses';
import { getDemoById } from '@/lib/db/queries/demos';
import { loadFeaturesFromDB } from '@/lib/coaching/config/persistence';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CircularProgress } from '@/components/ui/Progress';
import { RankComparisonWrapper } from '@/components/dashboard/RankComparisonWrapper';
import { AnalysisTabs } from '@/components/dashboard/AnalysisTabs';
import prisma from '@/lib/db/prisma';

// Mapping des noms de catégories vers les clés de features
const categoryMapping: Record<string, string> = {
  aim: 'aim',
  Aim: 'aim',
  AIM: 'aim',
  positioning: 'positioning',
  Positionnement: 'positioning',
  position: 'positioning',
  POSITIONING: 'positioning',
  utility: 'utility',
  Utilitaires: 'utility',
  utilities: 'utility',
  UTILITY: 'utility',
  economy: 'economy',
  'Économie': 'economy',
  eco: 'economy',
  ECONOMY: 'economy',
  timing: 'timing',
  Timing: 'timing',
  TIMING: 'timing',
  decision: 'decision',
  'Décisions': 'decision',
  decisions: 'decision',
  DECISION: 'decision',
};

interface AnalysisPageProps {
  params: { id: string };
}

function ScoreCard({ label, score, color }: { label: string; score: number; color?: string }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="text-center p-4 bg-gray-900/30 rounded-lg">
      <div className={`text-3xl font-bold ${color || getScoreColor(score)}`}>
        {Math.round(score)}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function AnalysisSection({
  title,
  score,
  analysis,
  icon
}: {
  title: string;
  score: number;
  analysis: any;
  icon: string;
}) {
  if (!analysis) return null;

  const renderAnalysisContent = () => {
    const entries = Object.entries(analysis);
    if (entries.length === 0) return <p className="text-gray-400">Aucune donnée disponible</p>;

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            const obj = value as Record<string, any>;
            return (
              <div key={key} className="bg-gray-900/30 rounded-lg p-3">
                <div className="text-sm text-gray-400 capitalize mb-2">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(obj).map(([subKey, subValue]) => (
                    <div key={subKey} className="flex justify-between">
                      <span className="text-gray-500 text-sm capitalize">
                        {subKey.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-white text-sm">
                        {typeof subValue === 'number'
                          ? subValue < 1 && subValue > 0
                            ? `${Math.round(subValue * 100)}%`
                            : Math.round(subValue * 100) / 100
                          : String(subValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={key} className="flex justify-between bg-gray-900/30 rounded-lg p-3">
              <span className="text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-white">
                {typeof value === 'number'
                  ? value < 1 && value > 0
                    ? `${Math.round(value * 100)}%`
                    : Math.round(value * 100) / 100
                  : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>{icon}</span>
            {title}
          </CardTitle>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {Math.round(score)}/100
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {renderAnalysisContent()}
      </CardContent>
    </Card>
  );
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const user = await requireAuth();
  const [demo, userData] = await Promise.all([
    getDemoById(params.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { rank: true, targetRank: true },
    }),
  ]);

  if (!demo || demo.userId !== user.id) {
    notFound();
  }

  if (!demo.analysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/demos/${params.id}`}>
            <Button variant="ghost" size="sm">
              ← Retour
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Analyse</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-gray-400">
            Aucune analyse disponible pour cette démo.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            L&apos;analyse sera disponible une fois le traitement terminé.
          </p>
        </Card>
      </div>
    );
  }

  // Charger les features pour filtrer le coaching
  const features = await loadFeaturesFromDB();
  const enabledCategories = new Set(
    Object.entries(features.categories)
      .filter(([_, config]) => config.enabled)
      .map(([key]) => key)
  );

  // Helper pour vérifier si une catégorie est activée
  const isCategoryEnabled = (categoryName: string): boolean => {
    const normalizedCategory = categoryMapping[categoryName] || categoryName.toLowerCase();
    return enabledCategories.has(normalizedCategory);
  };

  const analysis = demo.analysis;
  const rawCoachingReport = analysis.coachingReport as any;

  // Filtrer les données de coaching selon les features activées
  const filteredStrengths = analysis.strengths?.filter((s: string) => {
    // Les forces sont souvent des strings, on essaie de détecter la catégorie
    const categoryKeywords = ['aim', 'positioning', 'utility', 'economy', 'timing', 'decision'];
    const lowerS = s.toLowerCase();
    for (const keyword of categoryKeywords) {
      if (lowerS.includes(keyword) && !isCategoryEnabled(keyword)) {
        return false;
      }
    }
    return true;
  }) || [];

  const filteredWeaknesses = analysis.weaknesses?.filter((w: string) => {
    const categoryKeywords = ['aim', 'positioning', 'utility', 'economy', 'timing', 'decision'];
    const lowerW = w.toLowerCase();
    for (const keyword of categoryKeywords) {
      if (lowerW.includes(keyword) && !isCategoryEnabled(keyword)) {
        return false;
      }
    }
    return true;
  }) || [];

  // Filtrer le rapport de coaching
  const coachingReport = rawCoachingReport ? {
    ...rawCoachingReport,
    priority: rawCoachingReport.priority?.filter((item: any) =>
      isCategoryEnabled(item.area || item.category || '')
    ),
    priorityIssues: rawCoachingReport.priorityIssues?.filter((item: any) =>
      isCategoryEnabled(item.area || item.category || '')
    ),
    recommendations: rawCoachingReport.recommendations?.filter((rec: any) => {
      if (typeof rec === 'string') return true;
      return isCategoryEnabled(rec.category || rec.area || '');
    }),
  } : null;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/demos/${params.id}`}>
            <Button variant="ghost" size="sm">
              ← Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              Analyse - {demo.mapName.replace('de_', '')}
            </h1>
            <p className="text-gray-400">
              {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Score global */}
      <Card>
        <CardHeader>
          <CardTitle>Score Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <CircularProgress
                value={analysis.overallScore}
                size={160}
                strokeWidth={12}
                color="score"
              />
            </div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ScoreCard label="Aim" score={analysis.aimScore} />
                <ScoreCard label="Positionnement" score={analysis.positioningScore} />
                <ScoreCard label="Utilitaires" score={analysis.utilityScore} />
                <ScoreCard label="Économie" score={analysis.economyScore} />
                <ScoreCard label="Timing" score={analysis.timingScore} />
                <ScoreCard label="Décisions" score={analysis.decisionScore} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison vs Rang Cible */}
      {(() => {
        const mainPlayer = demo.playerStats.find((p) => p.isMainPlayer);
        if (!mainPlayer) return null;

        return (
          <RankComparisonWrapper
            playerStats={{
              rating: mainPlayer.rating,
              adr: mainPlayer.adr,
              kast: mainPlayer.kast,
              hsPercent: mainPlayer.headshotPercentage,
            }}
            currentRank={userData?.rank}
            targetRank={userData?.targetRank}
          />
        );
      })()}

      {/* Nouvelle section avec Tabs, Heatmap, Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse Détaillée</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisTabs
            analysis={{
              overallScore: analysis.overallScore,
              aimScore: analysis.aimScore,
              positioningScore: analysis.positioningScore,
              utilityScore: analysis.utilityScore,
              economyScore: analysis.economyScore,
              timingScore: analysis.timingScore,
              decisionScore: analysis.decisionScore,
              aimAnalysis: analysis.aimAnalysis,
              positioningAnalysis: analysis.positioningAnalysis,
              utilityAnalysis: analysis.utilityAnalysis,
              economyAnalysis: analysis.economyAnalysis,
              timingAnalysis: analysis.timingAnalysis,
              decisionAnalysis: analysis.decisionAnalysis,
              strengths: filteredStrengths,
              weaknesses: filteredWeaknesses,
              coachingReport: coachingReport,
            }}
            mapName={demo.mapName}
            playerDeaths={
              // Utiliser individualDeaths (positions individuelles) plutôt que deathPositions (clusters)
              (((analysis.positioningAnalysis as any)?.individualDeaths) || []).map((pos: any) => ({
                x: pos.x ?? 0,
                y: pos.y ?? 0,
                round: pos.round,
                weapon: pos.weapon,
                wasTraded: pos.wasTraded ?? false,
                wasBlind: pos.wasBlind ?? false,
              }))
            }
            playerKills={
              // Utiliser killPositions des données d'analyse aim
              (((analysis.aimAnalysis as any)?.killPositions) || []).map((pos: any) => ({
                x: pos.x ?? 0,
                y: pos.y ?? 0,
                round: pos.round,
                weapon: pos.weapon,
                wasHeadshot: pos.wasHeadshot ?? false,
              }))
            }
          />
        </CardContent>
      </Card>

      {/* Points forts et faibles (filtrés selon features activées) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-400">Points forts</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStrengths.length > 0 ? (
              <ul className="space-y-2">
                {filteredStrengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Aucun point fort identifié</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">Points à améliorer</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWeaknesses.length > 0 ? (
              <ul className="space-y-2">
                {filteredWeaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">!</span>
                    <span className="text-gray-300">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Aucun point à améliorer identifié</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analyses détaillées */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AnalysisSection
          title="Aim"
          score={analysis.aimScore}
          analysis={analysis.aimAnalysis}
          icon="🎯"
        />
        <AnalysisSection
          title="Positionnement"
          score={analysis.positioningScore}
          analysis={analysis.positioningAnalysis}
          icon="📍"
        />
        <AnalysisSection
          title="Utilitaires"
          score={analysis.utilityScore}
          analysis={analysis.utilityAnalysis}
          icon="💣"
        />
        <AnalysisSection
          title="Économie"
          score={analysis.economyScore}
          analysis={analysis.economyAnalysis}
          icon="💰"
        />
        <AnalysisSection
          title="Timing"
          score={analysis.timingScore}
          analysis={analysis.timingAnalysis}
          icon="⏱️"
        />
        <AnalysisSection
          title="Décisions"
          score={analysis.decisionScore}
          analysis={analysis.decisionAnalysis}
          icon="🧠"
        />
      </div>

      {/* Rapport de coaching */}
      {coachingReport && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport de coaching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Priorités */}
            {coachingReport.priority && coachingReport.priority.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Priorités</h3>
                <div className="space-y-2">
                  {coachingReport.priority.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        item.severity === 'high'
                          ? 'border-red-500/50 bg-red-500/10'
                          : item.severity === 'medium'
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-gray-500/50 bg-gray-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium capitalize">
                          {item.area}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.severity === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : item.severity === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{item.issue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations */}
            {coachingReport.recommendations && coachingReport.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Recommandations</h3>
                <ul className="space-y-2">
                  {coachingReport.recommendations.map((rec: any, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="text-cs2-accent">→</span>
                      {typeof rec === 'string' ? rec : rec.description || rec.text || JSON.stringify(rec)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exercices */}
            {coachingReport.exercises && coachingReport.exercises.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Exercices suggérés</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {coachingReport.exercises.map((exercise: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-900/30 rounded-lg">
                      <p className="text-white font-medium">
                        {typeof exercise === 'string' ? exercise : exercise.name || exercise.title}
                      </p>
                      {exercise.description && (
                        <p className="text-gray-400 text-sm mt-1">{exercise.description}</p>
                      )}
                      {exercise.duration && (
                        <p className="text-gray-500 text-xs mt-1">Durée: {exercise.duration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}