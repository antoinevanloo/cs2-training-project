import { Exercise } from '../types';

export const exercises: Exercise[] = [
  // Aim exercises
  {
    name: 'Aim Botz - 500 Kills',
    duration: 15,
    type: 'workshop',
    description: 'Tue 500 bots en te concentrant sur le placement de viseur',
  },
  {
    name: 'DM Headshot Only',
    duration: 20,
    type: 'community_server',
    description: 'Joue en DM sur serveur HS only',
  },
  {
    name: 'Recoil Master Practice',
    duration: 10,
    type: 'workshop',
    description: 'Pratique les patterns AK-47 et M4',
  },
  {
    name: 'Fast Aim Training',
    duration: 15,
    type: 'workshop',
    description: 'Entraînement de réflexes rapides',
  },

  // Positioning exercises
  {
    name: 'Demo Review',
    duration: 30,
    type: 'theory',
    description: 'Analyse tes propres démos pour identifier les erreurs',
  },
  {
    name: 'Pro POV Analysis',
    duration: 20,
    type: 'theory',
    description: 'Regarde les POV de joueurs pros sur ta map préférée',
  },
  {
    name: 'Retakes Server',
    duration: 25,
    type: 'community_server',
    description: 'Pratique les retakes et la lecture de situation',
  },

  // Utility exercises
  {
    name: 'Smoke Lineups',
    duration: 20,
    type: 'workshop',
    description: 'Apprends 5 nouveaux smokes sur ta map favorite',
  },
  {
    name: 'Flash Practice',
    duration: 15,
    type: 'workshop',
    description: 'Pratique les pop flashes et self-flashes',
  },
  {
    name: 'Execute Practice',
    duration: 20,
    type: 'workshop',
    description: 'Pratique une exécute complète avec toutes les utilités',
  },

  // Timing exercises
  {
    name: 'Prefire Practice',
    duration: 15,
    type: 'workshop',
    description: 'Pratique les prefires sur les angles communs',
  },
  {
    name: '1v1 Arena',
    duration: 20,
    type: 'community_server',
    description: 'Améliore ton timing de peek en 1v1',
  },

  // Decision exercises
  {
    name: 'Clutch Scenarios',
    duration: 20,
    type: 'community_server',
    description: 'Pratique les situations de clutch',
  },
  {
    name: 'Economy Study',
    duration: 15,
    type: 'theory',
    description: 'Étudie les règles d\'économie optimales',
  },
];

export const workshopMaps: string[] = [
  'Aim Botz',
  'Recoil Master',
  'Fast Aim/Reflex Training',
  'Prefire Practice - Dust 2',
  'Prefire Practice - Mirage',
  'Prefire Practice - Inferno',
  'Yprac Aim Trainer',
  'Yprac Prefire',
  'Yprac Smoke Practice',
  'training_aim_csgo2',
  'Smoke Practice',
];
