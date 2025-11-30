import { CoachingRule } from '../types';
import { AnalysisResult } from '../../analysis/types';

export const decisionRules: CoachingRule[] = [
  {
    id: 'poor_clutch_performance',
    category: 'decision',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.decision?.clutchPerformance?.score !== undefined &&
      analysis.analyses.decision.clutchPerformance.score < 50,
    recommendation: {
      title: 'Performances en clutch faibles',
      description:
        'Tu ne réussis pas assez tes clutchs. Les situations 1vX demandent calme, ' +
        'gestion du temps et prise de décision rapide.',
      exercises: [
        {
          name: 'Clutch Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les situations de clutch en serveurs dédiés',
        },
        {
          name: 'Pro Clutch Analysis',
          duration: 15,
          type: 'theory',
          description: 'Analyse les clutchs des pros et note leurs décisions',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'reckless_play_style',
    category: 'decision',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.decision?.riskTaking?.reckless !== undefined &&
      analysis.analyses.decision.riskTaking.reckless > 3,
    recommendation: {
      title: 'Style de jeu trop risqué',
      description:
        'Tu prends trop de risques non calculés. Chaque push, chaque peek doit avoir ' +
        'une raison valable. L\'agressivité doit être contrôlée.',
      exercises: [
        {
          name: 'Decision Making Analysis',
          duration: 20,
          type: 'theory',
          description: 'Analyse tes prises de décision dans tes démos',
        },
        {
          name: 'Conservative Practice',
          duration: 25,
          type: 'community_server',
          description: 'Joue de façon plus conservative pendant quelques parties',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'poor_first_duel_rate',
    category: 'decision',
    priority: 1,
    condition: (analysis: AnalysisResult) => {
      const kd = analysis.playerStats.kills / Math.max(1, analysis.playerStats.deaths);
      // Un KD faible avec beaucoup de morts = mauvaises décisions d'engagement
      return kd < 0.8 && analysis.playerStats.deaths > 12;
    },
    recommendation: {
      title: 'Mauvais choix d\'engagements',
      description:
        'Tu perds trop souvent tes duels initiaux. Tu engages peut-être dans des ' +
        'situations défavorables. Apprends à choisir tes combats.',
      exercises: [
        {
          name: '1v1 Arena Practice',
          duration: 20,
          type: 'community_server',
          description: 'Améliore tes duels en situation contrôlée',
        },
        {
          name: 'Angle Advantage Guide',
          duration: 15,
          type: 'theory',
          description: 'Comprends quand tu as l\'avantage d\'angle et quand non',
        },
      ],
      workshopMaps: ['Prefire Practice'],
    },
  },
  {
    id: 'poor_retake_decisions',
    category: 'decision',
    priority: 2,
    condition: (analysis: AnalysisResult) => {
      const retake = analysis.analyses.decision?.retakeDecisions;
      if (!retake) return false;
      const total = retake.correct + retake.incorrect;
      if (total === 0) return false;
      return retake.incorrect / total > 0.5;
    },
    recommendation: {
      title: 'Mauvaises décisions en retake',
      description:
        'Tes décisions en retake ne sont pas efficaces. Tu dois mieux coordonner avec ton équipe ' +
        'et utiliser tes utilités de façon optimale.',
      exercises: [
        {
          name: 'Retakes Server',
          duration: 25,
          type: 'community_server',
          description: 'Pratique les retakes en serveur dédié',
        },
        {
          name: 'Utility for Retakes',
          duration: 20,
          type: 'workshop',
          description: 'Apprends les lineups de retake par site',
        },
      ],
      workshopMaps: ['Yprac Maps'],
    },
  },
  {
    id: 'too_passive',
    category: 'decision',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.decision?.aggressionLevel === 'passive' &&
      analysis.playerStats.rating < 1.0,
    recommendation: {
      title: 'Style de jeu trop passif',
      description:
        'Tu joues trop passivement, ce qui limite ton impact. ' +
        'Apprends à être plus proactif et à créer des opportunités.',
      exercises: [
        {
          name: 'Entry Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les entrées de site en premiers',
        },
        {
          name: 'Aggressive Positioning Study',
          duration: 15,
          type: 'theory',
          description: 'Apprends les positions agressives et quand les utiliser',
        },
      ],
      workshopMaps: ['Prefire Practice'],
    },
  },
  {
    id: 'too_aggressive',
    category: 'decision',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.decision?.aggressionLevel === 'aggressive' &&
      analysis.playerStats.deaths > analysis.playerStats.kills,
    recommendation: {
      title: 'Style de jeu trop agressif',
      description:
        'Tu es trop agressif sans avoir les kills pour le justifier. ' +
        'Apprends à choisir tes moments d\'agression.',
      exercises: [
        {
          name: 'Timing Study',
          duration: 15,
          type: 'theory',
          description: 'Apprends quand être agressif et quand ne pas l\'être',
        },
        {
          name: 'Controlled Aggression Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique l\'agression calculée en retakes',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'low_clutch_attempts_conversion',
    category: 'decision',
    priority: 3,
    condition: (analysis: AnalysisResult) => {
      const clutch = analysis.analyses.decision?.clutchPerformance;
      if (!clutch || clutch.attempts < 3) return false;
      const winRate = clutch.won / clutch.attempts;
      return winRate < 0.2;
    },
    recommendation: {
      title: 'Faible taux de conversion en clutch',
      description:
        'Tu tentes des clutchs mais tu ne les convertis pas assez. ' +
        'Travaille ta gestion du temps et ta prise de décision sous pression.',
      exercises: [
        {
          name: 'Clutch Scenarios Practice',
          duration: 25,
          type: 'community_server',
          description: 'Entraîne-toi spécifiquement aux situations de clutch',
        },
        {
          name: 'Time Management Study',
          duration: 15,
          type: 'theory',
          description: 'Apprends à gérer le temps en situation de clutch',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'low_calculated_risks',
    category: 'decision',
    priority: 4,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.decision?.riskTaking?.calculated !== undefined &&
      analysis.analyses.decision.riskTaking.calculated < 2 &&
      analysis.analyses.decision.riskTaking.reckless === 0,
    recommendation: {
      title: 'Pas assez de prises de risque calculées',
      description:
        'Tu ne prends pas assez de risques calculés. Parfois, un play osé mais réfléchi ' +
        'peut faire basculer un round.',
      exercises: [
        {
          name: 'Playmaking Study',
          duration: 20,
          type: 'theory',
          description: 'Analyse comment les pros créent des opportunities',
        },
        {
          name: 'Creative Plays Practice',
          duration: 20,
          type: 'community_server',
          description: 'Expérimente des plays non conventionnels',
        },
      ],
      workshopMaps: [],
    },
  },
];