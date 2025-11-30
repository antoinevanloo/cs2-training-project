import { CoachingRule } from '../types';
import { AnalysisResult } from '../../analysis/types';

export const economyRules: CoachingRule[] = [
  {
    id: 'poor_buy_decisions',
    category: 'economy',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.economy?.buyDecisions?.score !== undefined &&
      analysis.analyses.economy.buyDecisions.score < 70,
    recommendation: {
      title: 'Mauvaises décisions d\'achat',
      description:
        'Tes décisions d\'achat ne sont pas optimales. Tu achètes souvent au mauvais moment, ' +
        'ce qui handicape l\'économie de ton équipe. Apprends les basics de l\'économie CS2.',
      exercises: [
        {
          name: 'Economy Guide',
          duration: 20,
          type: 'theory',
          description: 'Étudie les règles d\'économie CS2 et le système de loss bonus',
        },
        {
          name: 'Practice Games',
          duration: 30,
          type: 'community_server',
          description: 'Applique les règles en matchs et analyse tes achats',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'force_buy_addiction',
    category: 'economy',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.economy?.saveRounds?.inappropriate !== undefined &&
      analysis.analyses.economy.saveRounds.inappropriate > 2,
    recommendation: {
      title: 'Trop de force buys',
      description:
        'Tu forces trop souvent au lieu de sauver. Cela nuit à l\'économie de ton équipe ' +
        'et vous met dans des situations difficiles plusieurs rounds de suite.',
      exercises: [
        {
          name: 'Team Economy Analysis',
          duration: 15,
          type: 'theory',
          description: 'Apprends à analyser l\'économie d\'équipe avant d\'acheter',
        },
        {
          name: 'Demo Review - Economy Focus',
          duration: 20,
          type: 'theory',
          description: 'Revois tes démos en te concentrant sur les décisions d\'achat',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'negative_team_impact',
    category: 'economy',
    priority: 2,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.economy?.impactOnTeam?.negativeRounds !== undefined &&
      analysis.analyses.economy.impactOnTeam.negativeRounds > 3,
    recommendation: {
      title: 'Impact négatif sur l\'économie d\'équipe',
      description:
        'Tes décisions économiques ont un impact négatif sur ton équipe. ' +
        'Pense à l\'économie globale, pas seulement à la tienne.',
      exercises: [
        {
          name: 'Team Economy Study',
          duration: 15,
          type: 'theory',
          description: 'Apprends à considérer l\'économie de toute l\'équipe',
        },
        {
          name: 'Communication Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique la communication sur les achats en équipe',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'dying_with_money',
    category: 'economy',
    priority: 3,
    condition: (analysis: AnalysisResult) =>
      analysis.analyses.economy?.avgMoneyAtDeath !== undefined &&
      analysis.analyses.economy.avgMoneyAtDeath > 3000,
    recommendation: {
      title: 'Trop d\'argent non dépensé avant de mourir',
      description:
        'Tu meurs souvent avec beaucoup d\'argent. Utilise ton économie pour acheter des utilités ' +
        'supplémentaires ou drop des armes à tes coéquipiers.',
      exercises: [
        {
          name: 'Full Buy Checklist',
          duration: 10,
          type: 'theory',
          description: 'Crée une checklist mentale: armure, arme, kit, utilités complètes',
        },
        {
          name: 'Team Economy Communication',
          duration: 15,
          type: 'theory',
          description: 'Apprends à communiquer sur l\'économie avec ton équipe',
        },
      ],
      workshopMaps: [],
    },
  },
  {
    id: 'expensive_deaths',
    category: 'economy',
    priority: 2,
    condition: (analysis: AnalysisResult) => {
      const rating = analysis.playerStats.rating;
      const deaths = analysis.playerStats.deaths;
      // Beaucoup de morts avec un rating bas = morts coûteuses
      return rating < 0.9 && deaths > 15;
    },
    recommendation: {
      title: 'Morts coûteuses fréquentes',
      description:
        'Tu meurs souvent avec un équipement complet sans avoir eu d\'impact. ' +
        'Chaque mort avec une arme coûteuse sans kill est une perte économique importante.',
      exercises: [
        {
          name: 'Impact Awareness',
          duration: 15,
          type: 'theory',
          description: 'Apprends à évaluer si un engagement vaut le risque',
        },
        {
          name: 'Trade Position Practice',
          duration: 20,
          type: 'community_server',
          description: 'Pratique les positions où tu peux être tradé',
        },
      ],
      workshopMaps: ['Retakes Practice'],
    },
  },
];