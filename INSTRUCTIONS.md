# INSTRUCTIONS - Todo List pour Développement Futur

Ce document liste TOUT ce qui doit être donné en contexte et accompli pour continuer le développement.

---

## 🚨 CONTEXTE OBLIGATOIRE À DONNER À L'IA

### Prompt Initial Recommandé

```
Tu travailles sur CS2 Coach, une plateforme de coaching CS2 automatisée.

LECTURE OBLIGATOIRE :
- Lis CLAUDE.md pour les règles de développement
- Lis README.md pour le contexte projet

STACK : Next.js 14 (App Router), TypeScript strict, Tailwind, PostgreSQL, Prisma, NextAuth v5, pg-boss, demoparser2 (Python)

ARCHITECTURE :
- src/lib/analysis/ : 6 analyseurs (aim, positioning, utility, economy, timing, decision)
- src/lib/coaching/ : moteur de recommandations (rules → exercises)
- src/lib/jobs/ : workers pg-boss pour traitement async
- scripts/demo-parser/ : parser Python

OBJECTIF BUSINESS : Différenciation par conseils actionnables (pas juste stats), économie (VPS 5-10€/mois), simplicité UX.
```

---

## ✅ TODO LIST PRIORITAIRE

### 🔴 CRITIQUE - À Faire Immédiatement

#### 1. Créer le fichier `src/lib/coaching/rules.ts`
```typescript
// Structure attendue
import { CoachingRule } from './types';

export const aimRules: CoachingRule[] = [
  {
    id: 'low_headshot_percentage',
    category: 'aim',
    priority: 1,
    condition: (analysis) => analysis.scores.aim < 40,
    recommendation: {
      title: 'Améliorer le placement crosshair',
      description: 'Votre pourcentage de headshot est en dessous de la moyenne...',
      exercises: [
        { name: 'Aim Botz - HS Only', duration: 15, type: 'workshop' },
        { name: 'Prefire Practice', duration: 10, type: 'workshop' },
      ],
      workshopMaps: ['3449855428'], // IDs Steam Workshop
    },
  },
  // ... autres règles
];

export const positioningRules: CoachingRule[] = [ /* ... */ ];
export const utilityRules: CoachingRule[] = [ /* ... */ ];
export const economyRules: CoachingRule[] = [ /* ... */ ];
export const timingRules: CoachingRule[] = [ /* ... */ ];
export const decisionRules: CoachingRule[] = [ /* ... */ ];

export const allCoachingRules: CoachingRule[] = [
  ...aimRules,
  ...positioningRules,
  ...utilityRules,
  ...economyRules,
  ...timingRules,
  ...decisionRules,
];
```

#### 2. Créer le fichier `src/lib/coaching/exercises.ts`
```typescript
// Structure attendue
import { Exercise } from './types';

export const exercises: Exercise[] = [
  // AIM
  {
    name: 'Aim Botz - Classic',
    duration: 15,
    type: 'workshop',
    description: 'Entraînement aim classique avec bots statiques',
    workshopId: '3449855428',
    category: 'aim',
  },
  {
    name: 'Reflex Training',
    duration: 10,
    type: 'workshop',
    description: 'Améliorer temps de réaction',
    workshopId: '3449855428',
    category: 'aim',
  },
  // UTILITY
  {
    name: 'Yprac Mirage',
    duration: 20,
    type: 'workshop',
    description: 'Apprendre les smokes et flashs de Mirage',
    workshopId: '3449855428',
    category: 'utility',
  },
  // ... autres exercices
];
```

#### 3. Implémenter comparaison vs rang cible
- Ajouter champ `targetRank` dans User (Prisma)
- Créer table `RankAverages` avec moyennes par rang
- Afficher comparaison dans page analyse

### 🟠 IMPORTANT - Phase 2

#### 4. Enrichir les analyseurs existants
Les analyseurs actuels font beaucoup d'estimations. À améliorer :

**`src/lib/analysis/analyzers/aim.ts`**
- Calculer vraie accuracy (shots fired vs hits) si disponible
- Meilleur calcul spray control

**`src/lib/analysis/analyzers/positioning.ts`**
- Utiliser positions tick-by-tick pour heatmap
- Détecter patterns de mort répétés

**`src/lib/analysis/analyzers/utility.ts`**
- Tracker flash assists réels
- Calculer smoke timing vs execute

#### 5. Ajouter tests unitaires
```bash
npm install -D vitest @testing-library/react jsdom
```

Fichiers à créer :
- `src/lib/analysis/analyzers/aim.test.ts`
- `src/lib/analysis/engine.test.ts`
- `src/lib/coaching/engine.test.ts`

#### 6. Améliorer UX
- [ ] Skeleton loaders pendant chargement
- [ ] Toast notifications sur actions
- [ ] Confirmation avant suppression
- [ ] Progress bar upload
- [ ] Dark mode toggle

### 🟡 NICE TO HAVE - Phase 3

#### 7. Clips automatiques
- Intégrer FFmpeg
- Extraire ticks des erreurs critiques
- Générer clips 10-15 secondes

#### 8. Discord Bot
- Webhook post-match
- Résumé stats + recommandation #1
- Commandes pour stats

#### 9. Système Premium
- [ ] Stripe integration
- [ ] Limites par tier (demos/semaine)
- [ ] Features gated

---

## 📁 FICHIERS MANQUANTS À CRÉER

| Fichier | Priorité | Description |
|---------|----------|-------------|
| `src/lib/coaching/rules.ts` | 🔴 CRITIQUE | Règles de coaching |
| `src/lib/coaching/exercises.ts` | 🔴 CRITIQUE | Base exercices |
| `src/lib/analysis/types/rank-averages.ts` | 🟠 IMPORTANT | Moyennes par rang |
| `src/components/dashboard/RankComparison.tsx` | 🟠 IMPORTANT | UI comparaison |
| `vitest.config.ts` | 🟠 IMPORTANT | Config tests |
| `src/lib/**/*.test.ts` | 🟠 IMPORTANT | Tests unitaires |
| `src/lib/clips/generator.ts` | 🟡 LATER | Génération clips |
| `src/lib/discord/bot.ts` | 🟡 LATER | Bot Discord |

---

## 🔧 CORRECTIONS TECHNIQUES EN ATTENTE

### Prisma Schema - Additions Suggérées

```prisma
// Ajouter dans prisma/schema.prisma

model User {
  // ... existant ...
  targetRank    String?   // "silver", "gold", "mg", "dmg", "le", "lem", "smfc", "global"
  tier          UserTier  @default(FREE)
}

enum UserTier {
  FREE
  STARTER
  PRO
  TEAM
}

model RankAverages {
  id            String   @id @default(cuid())
  rank          String   @unique
  avgRating     Float
  avgAdr        Float
  avgHsPercent  Float
  avgKast       Float
  sampleSize    Int
  updatedAt     DateTime @updatedAt
}

model Challenge {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          String   // "aim", "utility", etc.
  target        Json     // { metric: "hsPercent", value: 50 }
  completed     Boolean  @default(false)
  expiresAt     DateTime
  createdAt     DateTime @default(now())
}
```

### API Routes Manquantes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/user/target-rank` | PUT | Définir rang cible |
| `/api/challenges` | GET | Liste challenges actifs |
| `/api/challenges/complete` | POST | Marquer challenge complété |
| `/api/clips/[demoId]` | GET | Générer clips erreurs |

---

## 📊 DONNÉES DE RÉFÉRENCE

### Moyennes par Rang (à intégrer)

```typescript
export const RANK_AVERAGES = {
  silver: { rating: 0.85, adr: 55, hsPercent: 35, kast: 60 },
  gold: { rating: 0.95, adr: 65, hsPercent: 40, kast: 65 },
  mg: { rating: 1.02, adr: 72, hsPercent: 45, kast: 68 },
  dmg: { rating: 1.08, adr: 78, hsPercent: 48, kast: 70 },
  le: { rating: 1.12, adr: 82, hsPercent: 50, kast: 72 },
  lem: { rating: 1.18, adr: 85, hsPercent: 52, kast: 74 },
  smfc: { rating: 1.22, adr: 88, hsPercent: 54, kast: 76 },
  global: { rating: 1.30, adr: 92, hsPercent: 56, kast: 78 },
};
```

### Workshop Maps Recommandées

```typescript
export const WORKSHOP_MAPS = {
  aim: [
    { name: 'Aim Botz', id: '243702660' },
    { name: 'Fast Aim/Reflex', id: '368026786' },
    { name: 'training_aim_csgo2', id: '213240871' },
  ],
  utility: [
    { name: 'Yprac Mirage', id: '1222094548' },
    { name: 'Yprac Inferno', id: '1222094845' },
    { name: 'Yprac Dust2', id: '1222094738' },
    { name: 'Yprac Overpass', id: '1222095013' },
    { name: 'Yprac Nuke', id: '1222095142' },
    { name: 'Yprac Ancient', id: '2480240987' },
    { name: 'Yprac Anubis', id: '2880014077' },
  ],
  movement: [
    { name: 'Surf Beginner', id: '1361532238' },
    { name: 'KZ Beginner', id: '1911tried' },
  ],
  prefire: [
    { name: 'Prefire Mirage', id: '1222094548' },
    { name: 'Prefire Inferno', id: '1222094845' },
  ],
};
```

---

## 🎯 CRITÈRES DE SUCCÈS MVP

### Fonctionnel
- [ ] User peut upload .dem et voir analyse en < 5 min
- [ ] 6 scores catégories affichés avec détails
- [ ] Au moins 5 recommandations générées par analyse
- [ ] Plan hebdomadaire affiché
- [ ] Stats agrégées sur dashboard

### Performance
- [ ] Build production < 30s
- [ ] Page dashboard charge < 2s
- [ ] Traitement demo < 5 min

### Qualité
- [ ] 0 erreurs TypeScript
- [ ] 0 erreurs ESLint bloquantes
- [ ] Tests passent (quand ajoutés)
- [ ] Docker build fonctionne

---

## 💡 IDÉES FUTURES (Non Prioritaires)

1. **Heatmaps positions** - Visualiser où le joueur meurt le plus
2. **Replay 2D** - Viewer simplifié type radar
3. **Export PDF** - Rapport d'analyse exportable
4. **API publique** - Pour intégrations tierces
5. **Mobile app** - React Native wrapper
6. **Tournois integration** - FACEIT/ESEA API
7. **Coaching live** - Overlay in-game
8. **Social features** - Partage, comparaison amis
9. **Leaderboards** - Classement progression
10. **Predictions** - Estimer rang atteignable

---

## 🔐 SÉCURITÉ - À Ne Pas Oublier

- [ ] Rate limiting sur API upload
- [ ] Validation taille fichier côté serveur
- [ ] Sanitization noms fichiers
- [ ] CSRF protection
- [ ] Headers sécurité (helmet)
- [ ] Audit dépendances (`npm audit`)

---

## 📞 CONTACTS & RESSOURCES

### Documentation
- [Next.js 14](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth v5](https://authjs.dev/)
- [pg-boss](https://github.com/timgit/pg-boss)
- [demoparser2](https://github.com/LaihoE/demoparser)

### Communauté CS2
- [HLTV](https://www.hltv.org) - Stats référence
- [Leetify](https://leetify.com) - Concurrent
- [Scope.gg](https://scope.gg) - Concurrent

---

**Dernière mise à jour** : $(date)

Ce document doit être maintenu à jour au fil du développement.
