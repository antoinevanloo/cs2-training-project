import { requireAuth } from '@/lib/auth/utils';
import { getAnalysesByUserId, getWeaknessesFrequency } from '@/lib/db/queries/analyses';
import { loadFeaturesFromDB } from '@/lib/coaching/config/persistence';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { exercises } from '@/lib/coaching/exercises';

// Mapping des noms de catégories vers les clés de features
const categoryMapping: Record<string, string> = {
  aim: 'aim',
  Aim: 'aim',
  positioning: 'positioning',
  Positionnement: 'positioning',
  utility: 'utility',
  Utilitaires: 'utility',
  economy: 'economy',
  'Économie': 'economy',
  timing: 'timing',
  Timing: 'timing',
  decision: 'decision',
  'Décisions': 'decision',
};

export default async function CoachingPage() {
  const user = await requireAuth();

  const [analyses, weaknessesFreq, features] = await Promise.all([
    getAnalysesByUserId(user.id, 5),
    getWeaknessesFrequency(user.id),
    loadFeaturesFromDB(),
  ]);

  // Déterminer les catégories activées
  const enabledCategories = new Set(
    Object.entries(features.categories)
      .filter(([_, config]) => config.enabled)
      .map(([key]) => key)
  );

  const isCategoryEnabled = (categoryName: string): boolean => {
    const normalizedCategory = categoryMapping[categoryName] || categoryName.toLowerCase();
    return enabledCategories.has(normalizedCategory);
  };

  const latestAnalysis = analyses[0];
  const rawCoachingReport = latestAnalysis?.coachingReport as any;

  // Filtrer le rapport de coaching selon les features activées
  const coachingReport = rawCoachingReport ? {
    ...rawCoachingReport,
    priorityIssues: rawCoachingReport.priorityIssues?.filter((item: any) =>
      isCategoryEnabled(item.area || item.category || '')
    ),
    recommendations: rawCoachingReport.recommendations?.filter((rec: any) => {
      if (typeof rec === 'string') return true;
      return isCategoryEnabled(rec.category || rec.area || '');
    }),
  } : null;

  // Filtrer les faiblesses récurrentes
  const filteredWeaknessesFreq = weaknessesFreq.filter((w) => {
    const categoryKeywords = ['aim', 'positioning', 'utility', 'economy', 'timing', 'decision'];
    const lowerName = w.name.toLowerCase();
    for (const keyword of categoryKeywords) {
      if (lowerName.includes(keyword) && !isCategoryEnabled(keyword)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Coaching</h1>
        <p className="text-gray-400 mt-1">
          Recommandations personnalisées pour améliorer votre gameplay
        </p>
      </div>

      {!latestAnalysis ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">
            Uploadez et analysez des demos pour recevoir des recommandations
          </p>
        </Card>
      ) : (
        <>
          {/* Priority Issues */}
          {coachingReport?.priorityIssues?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Problèmes prioritaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coachingReport.priorityIssues.map((issue: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        issue.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/50'
                          : issue.severity === 'high'
                          ? 'bg-orange-500/10 border-orange-500/50'
                          : 'bg-yellow-500/10 border-yellow-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            issue.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : issue.severity === 'high'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-white font-medium capitalize">
                          {issue.area}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {issue.issue.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {coachingReport?.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coachingReport.recommendations.slice(0, 5).map((rec: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-900/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white">{rec.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {rec.description}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                          {rec.category}
                        </span>
                      </div>
                      {rec.exercises?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-500 mb-2">
                            Exercices recommandés:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rec.exercises.map((ex: any, j: number) => (
                              <span
                                key={j}
                                className="text-xs bg-cs2-accent/20 text-cs2-accent px-2 py-1 rounded"
                              >
                                {ex.name} ({ex.duration}min)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weaknesses Frequency (filtrées selon features activées) */}
          {filteredWeaknessesFreq.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Faiblesses récurrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredWeaknessesFreq.slice(0, 5).map((weakness) => (
                    <div
                      key={weakness.name}
                      className="flex items-center justify-between p-2 bg-gray-900/30 rounded"
                    >
                      <span className="text-white">{weakness.name}</span>
                      <span className="text-gray-400">
                        {weakness.count} occurrence(s)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Exercises */}
          <Card>
            <CardHeader>
              <CardTitle>Exercices suggérés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {exercises.slice(0, 6).map((ex, i) => (
                  <div key={i} className="p-4 bg-gray-900/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-white">{ex.name}</h3>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {ex.duration}min
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{ex.description}</p>
                    <span
                      className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                        ex.type === 'workshop'
                          ? 'bg-blue-500/20 text-blue-400'
                          : ex.type === 'community_server'
                          ? 'bg-green-500/20 text-green-400'
                          : ex.type === 'theory'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {ex.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
