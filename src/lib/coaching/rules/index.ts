import { CoachingRule } from '../types';
import { aimRules } from './aim-rules';
import { positioningRules } from './positioning-rules';
import { utilityRules } from './utility-rules';

// Economy rules
const economyRules: CoachingRule[] = [
  {
    id: 'poor_buy_decisions',
    category: 'economy',
    priority: 2,
    condition: (analysis) =>
      analysis.analyses.economy?.buyDecisions?.score < 70,
    recommendation: {
      title: 'Mauvaises décisions d\'achat',
      description:
        'Tes décisions d\'achat ne sont pas optimales. Apprends les basics de l\'économie CS2.',
      exercises: [
        {
          name: 'Economy Guide',
          duration: 20,
          type: 'theory',
          description: 'Étudie les règles d\'économie CS2',
        },
        {
          name: 'Practice Games',
          duration: 30,
          type: 'community_server',
          description: 'Applique les règles en matchs',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'force_buy_addiction',
    category: 'economy',
    priority: 3,
    condition: (analysis) =>
      analysis.analyses.economy?.saveRounds?.inappropriate > 2,
    recommendation: {
      title: 'Trop de force buys',
      description:
        'Tu forces trop souvent au lieu de sauver. Cela nuit à l\'économie de ton équipe.',
      exercises: [
        {
          name: 'Team Economy Analysis',
          duration: 15,
          type: 'theory',
          description: 'Apprends à analyser l\'économie d\'équipe',
        },
      ],
      workshopMaps: [],
    },
  },
];

// Timing rules
const timingRules: CoachingRule[] = [
  {
    id: 'poor_trade_speed',
    category: 'timing',
    priority: 2,
    condition: (analysis) =>
      analysis.analyses.timing?.tradeSpeed?.successful < 0.5,
    recommendation: {
      title: 'Trades trop lents',
      description:
        'Tu ne trades pas assez vite tes coéquipiers. Travaille ta réactivité et ton positionnement.',
      exercises: [
        {
          name: 'Retakes Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les trades en retakes',
        },
        {
          name: 'Team Communication',
          duration: 15,
          type: 'theory',
          description: 'Améliore ta communication pour les trades',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'poor_peek_timing',
    category: 'timing',
    priority: 3,
    condition: (analysis) =>
      analysis.analyses.timing?.peekTiming?.score < 60,
    recommendation: {
      title: 'Mauvais timing de peek',
      description:
        'Ton timing de peek n\'est pas optimal. Travaille les prefires et la synchronisation.',
      exercises: [
        {
          name: 'Prefire Practice',
          duration: 15,
          type: 'workshop',
          description: 'Apprends les timings de prefire',
        },
        {
          name: 'DM Timing Focus',
          duration: 20,
          type: 'community_server',
          description: 'Concentre-toi sur le timing en DM',
        },
      ],
      workshopMaps: ['Prefire Practice', 'Yprac Prefire'],
    },
  },
];

// Decision rules
const decisionRules: CoachingRule[] = [
  {
    id: 'poor_clutch_performance',
    category: 'decision',
    priority: 2,
    condition: (analysis) =>
      analysis.analyses.decision?.clutchPerformance?.score < 50,
    recommendation: {
      title: 'Performances en clutch faibles',
      description:
        'Tu ne réussis pas assez tes clutchs. Travaille ta gestion du stress et ta prise de décision.',
      exercises: [
        {
          name: 'Clutch Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les situations de clutch',
        },
        {
          name: 'Pro Clutch Analysis',
          duration: 15,
          type: 'theory',
          description: 'Analyse les clutchs des pros',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'reckless_play_style',
    category: 'decision',
    priority: 3,
    condition: (analysis) =>
      analysis.analyses.decision?.riskTaking?.reckless > 3,
    recommendation: {
      title: 'Style de jeu trop risqué',
      description:
        'Tu prends trop de risques non calculés. Apprends à jouer plus intelligemment.',
      exercises: [
        {
          name: 'Decision Making Analysis',
          duration: 20,
          type: 'theory',
          description: 'Analyse tes prises de décision',
        },
        {
          name: 'Conservative Practice',
          duration: 25,
          type: 'community_server',
          description: 'Joue de façon plus conservative',
        },
      ],
      workshopMaps: [],
    },
  },
];

export const allCoachingRules: CoachingRule[] = [
  ...aimRules,
  ...positioningRules,
  ...utilityRules,
  ...economyRules,
  ...timingRules,
  ...decisionRules,
];
