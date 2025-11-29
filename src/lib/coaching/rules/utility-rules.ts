import { CoachingRule } from '../types';
import { AnalysisResult } from '../../analysis/types';

export const utilityRules: CoachingRule[] = [
  {
    id: 'low_flash_usage',
    category: 'utility',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.utility?.flashEfficiency?.thrown < 5,
    recommendation: {
      title: 'Utilisation insuffisante des flashs',
      description:
        'Tu utilises trop peu de flashbangs. Les flashs sont essentiels pour prendre des duels favorables.',
      exercises: [
        {
          name: 'Flash Training Map',
          duration: 20,
          type: 'workshop',
          description: 'Apprends les flashs pop et les self-flashes',
        },
        {
          name: 'Execute Practice',
          duration: 15,
          type: 'workshop',
          description: 'Pratique les exécutes avec utilités',
        },
      ],
      workshopMaps: ['Yprac Flash Practice', 'Smoke Practice'],
    },
  },
  {
    id: 'ineffective_flashes',
    category: 'utility',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.utility?.flashEfficiency?.effectiveness < 0.4,
    recommendation: {
      title: 'Flashs inefficaces',
      description:
        'Tes flashbangs ne touchent pas assez d\'ennemis. Travaille tes pop flashes et tes timings.',
      exercises: [
        {
          name: 'Pop Flash Tutorial',
          duration: 15,
          type: 'theory',
          description: 'Regarde des tutoriels sur les pop flashes',
        },
        {
          name: 'Flash Practice',
          duration: 15,
          type: 'workshop',
          description: 'Pratique les différents types de flashs',
        },
      ],
      workshopMaps: ['Yprac Maps', 'Smoke Practice'],
    },
  },
  {
    id: 'low_smoke_usage',
    category: 'utility',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.utility?.smokeUsage?.thrown < 3,
    recommendation: {
      title: 'Utilisation insuffisante des smokes',
      description:
        'Tu utilises trop peu de smokes. Les smokes sont essentiels pour les exécutes et les défenses.',
      exercises: [
        {
          name: 'Smoke Lineups',
          duration: 20,
          type: 'workshop',
          description: 'Apprends les lineups de smoke essentiels',
        },
        {
          name: 'Execute Practice',
          duration: 15,
          type: 'workshop',
          description: 'Pratique les exécutes complètes',
        },
      ],
      workshopMaps: ['Yprac Smoke Practice', 'Smoke Practice Maps'],
    },
  },
  {
    id: 'low_molotov_damage',
    category: 'utility',
    priority: 4,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.utility?.molotovDamage?.thrown > 0 &&
      analysis.analyses.utility?.molotovDamage?.totalDamage /
        analysis.analyses.utility?.molotovDamage?.thrown <
        20,
    recommendation: {
      title: 'Molotovs inefficaces',
      description:
        'Tes molotovs ne font pas assez de dégâts. Apprends à mieux les placer.',
      exercises: [
        {
          name: 'Molotov Lineups',
          duration: 15,
          type: 'workshop',
          description: 'Apprends les lineups de molotov pour déloger',
        },
        {
          name: 'Timing Practice',
          duration: 10,
          type: 'workshop',
          description: 'Pratique le timing des molotovs',
        },
      ],
      workshopMaps: ['Yprac Maps', 'Molotov Practice'],
    },
  },
];
