import { CoachingRule } from '../types';
import { AnalysisResult } from '../../analysis/types';

export const positioningRules: CoachingRule[] = [
  {
    id: 'repeated_death_positions',
    category: 'positioning',
    priority: 1,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.positioning?.deathPositions?.some((p) => p.isBadPosition) ||
      false,
    recommendation: {
      title: 'Positions de mort récurrentes',
      description:
        'Tu meurs trop souvent aux mêmes endroits. Varie tes positions et évite les spots prévisibles.',
      exercises: [
        {
          name: 'Review de démo personnelle',
          duration: 20,
          type: 'theory',
          description: 'Analyse tes morts et identifie les patterns',
        },
        {
          name: 'Pratique de off-angles',
          duration: 15,
          type: 'workshop',
          description: 'Apprends des positions alternatives',
        },
      ],
      workshopMaps: ['Yprac Maps', 'Prefire Practice'],
    },
  },
  {
    id: 'poor_map_control',
    category: 'positioning',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.positioning?.mapControl?.score < 50,
    recommendation: {
      title: 'Contrôle de map insuffisant',
      description:
        'Tu ne prends pas assez de contrôle sur la map. Travaille ta lecture du jeu et tes timings de push.',
      exercises: [
        {
          name: 'Watch Pro Matches',
          duration: 30,
          type: 'theory',
          description: 'Observe le contrôle de map des équipes pro',
        },
        {
          name: 'Retakes Server',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les rotations et retakes',
        },
      ],
      workshopMaps: ['Yprac Maps'],
    },
  },
  {
    id: 'wide_peeks',
    category: 'positioning',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.positioning?.commonMistakes?.includes('wide_peek') || false,
    recommendation: {
      title: 'Peeks trop larges',
      description:
        "Tu t'exposes trop lors de tes peeks. Utilise le jiggle peek et les shoulder peeks.",
      exercises: [
        {
          name: 'Jiggle Peek Practice',
          duration: 15,
          type: 'workshop',
          description: 'Maîtrise le mouvement de jiggle',
        },
        {
          name: 'DM Focus Positioning',
          duration: 15,
          type: 'community_server',
          description: 'Concentre-toi sur des peeks serrés en DM',
        },
      ],
      workshopMaps: ['Aim Botz', 'Prefire Practice'],
    },
  },
  {
    id: 'exposed_angles',
    category: 'positioning',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.positioning?.commonMistakes?.includes('exposed_angle') ||
      false,
    recommendation: {
      title: 'Exposition à plusieurs angles',
      description:
        "Tu t'exposes à plusieurs angles en même temps. Apprends à isoler les duels.",
      exercises: [
        {
          name: 'Angle Isolation Practice',
          duration: 15,
          type: 'workshop',
          description: "Pratique l'isolation d'angles",
        },
        {
          name: 'Review Pro POV',
          duration: 20,
          type: 'theory',
          description: 'Observe comment les pros isolent les duels',
        },
      ],
      workshopMaps: ['Yprac Maps'],
    },
  },
];
