import { CoachingRule } from '../types';
import { AnalysisResult } from '../../analysis/types';

export const aimRules: CoachingRule[] = [
  {
    id: 'low_hs_percentage',
    category: 'aim',
    priority: 1,
    condition: (analysis: AnalysisResult) =>
      analysis.playerStats.hsPercentage < 35,
    recommendation: {
      title: 'Améliorer le taux de headshot',
      description:
        'Ton taux de headshot est inférieur à 35%, ce qui indique un mauvais placement de viseur. ' +
        'Concentre-toi sur garder ton crosshair à hauteur de tête en permanence.',
      exercises: [
        {
          name: 'Aim Botz - Head Level Only',
          duration: 15,
          type: 'workshop',
          description: 'Désactive les bots qui ne sont pas à hauteur de tête',
        },
        {
          name: 'Prefire Practice',
          duration: 10,
          type: 'workshop',
          description: 'Entraîne les prefires sur les angles communs',
        },
      ],
      workshopMaps: ['Aim Botz', 'Prefire Practice Maps', 'Yprac Prefire'],
    },
  },
  {
    id: 'poor_first_bullet_accuracy',
    category: 'aim',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.aim?.firstBulletAccuracy < 0.35,
    recommendation: {
      title: 'Améliorer la précision du premier tir',
      description:
        'Ta précision au premier tir est faible. Travaille ton timing de tir et assure-toi de ne pas bouger en tirant.',
      exercises: [
        {
          name: 'DM HS Only',
          duration: 20,
          type: 'community_server',
          description: 'Joue uniquement sur des serveurs Headshot Only',
        },
        {
          name: 'Fast Aim / Reflex Training',
          duration: 10,
          type: 'workshop',
          description: 'Travaille la vitesse de réaction et la précision',
        },
      ],
      workshopMaps: ['Fast Aim/Reflex Training', 'Aim Botz'],
    },
  },
  {
    id: 'slow_reaction_time',
    category: 'aim',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.aim?.reactionTime?.average > 300,
    recommendation: {
      title: 'Améliorer le temps de réaction',
      description:
        'Ton temps de réaction moyen est supérieur à 300ms. ' +
        'Cela peut être amélioré avec un entraînement régulier.',
      exercises: [
        {
          name: 'Aim Lab / Kovaaks',
          duration: 15,
          type: 'external',
          description: 'Utilise un aim trainer dédié pour les réflexes',
        },
        {
          name: 'DM Pistol Only',
          duration: 15,
          type: 'community_server',
          description: 'Le pistol force des réactions rapides',
        },
      ],
      workshopMaps: ['Aim Botz', 'training_aim_csgo2'],
    },
  },
  {
    id: 'poor_spray_control',
    category: 'aim',
    priority: 4,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.aim?.sprayControl?.score < 50,
    recommendation: {
      title: 'Améliorer le contrôle du spray',
      description:
        'Ton contrôle du recul est insuffisant. Apprends les patterns des armes principales.',
      exercises: [
        {
          name: 'Recoil Master',
          duration: 15,
          type: 'workshop',
          description: 'Apprends les patterns de recul de chaque arme',
        },
        {
          name: 'Spray Practice Wall',
          duration: 10,
          type: 'workshop',
          description: 'Entraîne le spray sur un mur avec feedback visuel',
        },
      ],
      workshopMaps: ['Recoil Master', 'Aim Botz'],
    },
  },
  {
    id: 'inconsistent_crosshair_placement',
    category: 'aim',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.aim?.crosshairPlacement?.headLevelTime < 0.5,
    recommendation: {
      title: 'Crosshair placement inconsistant',
      description:
        'Tu ne gardes pas ton viseur à hauteur de tête assez souvent. ' +
        "C'est la compétence fondamentale à maîtriser.",
      exercises: [
        {
          name: 'Yprac Crosshair Placement',
          duration: 15,
          type: 'workshop',
          description: 'Maps spécialisées pour le placement de viseur',
        },
        {
          name: 'Watch Pro POV',
          duration: 20,
          type: 'theory',
          description: 'Observe comment les pros gardent leur crosshair',
        },
      ],
      workshopMaps: ['Yprac Maps', 'Prefire Practice'],
    },
  },
];
