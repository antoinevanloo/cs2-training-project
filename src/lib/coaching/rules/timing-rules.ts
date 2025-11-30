import { CoachingRule } from '../types';
import { AnalysisResult } from '../../analysis/types';

export const timingRules: CoachingRule[] = [
  {
    id: 'poor_trade_speed',
    category: 'timing',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.timing?.tradeSpeed?.successful !== undefined &&
      analysis.analyses.timing.tradeSpeed.successful < 0.5,
    recommendation: {
      title: 'Trades trop lents',
      description:
        'Tu ne trades pas assez vite tes coéquipiers. Un trade doit se faire en moins de 3 secondes ' +
        'pour être efficace. Travaille ta réactivité et ton positionnement.',
      exercises: [
        {
          name: 'Retakes Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les trades rapides en serveurs retakes',
        },
        {
          name: 'Team Communication',
          duration: 15,
          type: 'theory',
          description: 'Améliore ta communication pour des trades coordonnés',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'poor_peek_timing',
    category: 'timing',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.timing?.peekTiming?.score !== undefined &&
      analysis.analyses.timing.peekTiming.score < 60,
    recommendation: {
      title: 'Mauvais timing de peek',
      description:
        'Ton timing de peek n\'est pas optimal. Tu te fais souvent préfire car tes timings sont ' +
        'prévisibles. Varie tes approches et travaille les prefires.',
      exercises: [
        {
          name: 'Prefire Practice',
          duration: 15,
          type: 'workshop',
          description: 'Apprends les timings standards de prefire par map',
        },
        {
          name: 'DM Timing Focus',
          duration: 20,
          type: 'community_server',
          description: 'Pratique des peeks variés en DM, évite les patterns',
        },
      ],
      workshopMaps: ['Prefire Practice', 'Yprac Prefire'],
    },
  },
  {
    id: 'late_rotations',
    category: 'timing',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.timing?.rotationTiming?.late !== undefined &&
      analysis.analyses.timing.rotationTiming.late > 3,
    recommendation: {
      title: 'Rotations trop lentes',
      description:
        'Tu arrives souvent trop tard lors des rotations. Apprends à lire le jeu plus rapidement ' +
        'et à anticiper les mouvements ennemis.',
      exercises: [
        {
          name: 'Pro VOD Analysis - Rotations',
          duration: 25,
          type: 'theory',
          description: 'Analyse comment les pros décident de rotate',
        },
        {
          name: 'Retakes Server',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les rotations rapides en situation de retake',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'early_rotations',
    category: 'timing',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.timing?.rotationTiming?.early !== undefined &&
      analysis.analyses.timing.rotationTiming.early > 3,
    recommendation: {
      title: 'Rotations trop précoces',
      description:
        'Tu rotates trop tôt, ce qui laisse des zones non couvertes. ' +
        'Attends d\'avoir suffisamment d\'informations avant de quitter ton poste.',
      exercises: [
        {
          name: 'Info Gathering Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique la récolte d\'info avant de rotate',
        },
        {
          name: 'Map Control Theory',
          duration: 15,
          type: 'theory',
          description: 'Apprends quand rotate et quand tenir',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'slow_avg_trade_speed',
    category: 'timing',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.timing?.tradeSpeed?.average !== undefined &&
      analysis.analyses.timing.tradeSpeed.average > 4,
    recommendation: {
      title: 'Temps de trade moyen trop élevé',
      description:
        'En moyenne, tu mets trop de temps à trader tes coéquipiers. ' +
        'Un trade efficace se fait en moins de 2-3 secondes.',
      exercises: [
        {
          name: '2v2 Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les trades coordonnés en 2v2',
        },
        {
          name: 'Positioning for Trades',
          duration: 15,
          type: 'theory',
          description: 'Apprends à te positionner pour des trades rapides',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'getting_prefired',
    category: 'timing',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.timing?.peekTiming?.avgPrefire === true,
    recommendation: {
      title: 'Tu te fais préfire trop souvent',
      description:
        'Les ennemis anticipent tes peeks, ce qui indique des timings prévisibles. ' +
        'Varie tes approches et utilise des faux bruits.',
      exercises: [
        {
          name: 'Timing Variation Practice',
          duration: 15,
          type: 'community_server',
          description: 'Pratique des peeks avec des délais variés',
        },
        {
          name: 'Jiggle Peek Mastery',
          duration: 15,
          type: 'workshop',
          description: 'Maîtrise le jiggle peek pour récolter de l\'info',
        },
      ],
      workshopMaps: ['Prefire Practice'],
    },
  },
];