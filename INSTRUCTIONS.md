# INSTRUCTIONS - Historique de Développement CS2 Coach

Ce document historise les étapes de développement pour garder une vision claire de l'avancement.

---

## INSTRUCTION 1 - Système de Règles de Coaching Complet

**État** : ✅ TERMINÉ

**Objectif** : Créer le système complet de règles de coaching pour les 6 catégories d'analyse.

**Résumé** :
- Création de `src/lib/coaching/rules.ts` (point d'entrée)
- Création de `src/lib/coaching/exercises.ts` (point d'entrée)
- Création de `src/lib/coaching/rules/index.ts` (agrégateur)
- Création de `src/lib/coaching/exercises/index.ts` (agrégateur)
- Création des règles par catégorie :
  - `aim-rules.ts` - Règles aim (crosshair, HS%, spray)
  - `positioning-rules.ts` - Règles positionnement
  - `utility-rules.ts` - Règles utilitaires
  - `economy-rules.ts` - 5 règles économie (buy decisions, force buy, team impact, dying with money, expensive deaths)
  - `timing-rules.ts` - 6 règles timing (trade speed, peek timing, rotations, prefire)
  - `decision-rules.ts` - 8 règles décision (clutch, risk taking, engagement, retake, agressivité)
- Création `config/workshop-maps.ts` - Base de données Workshop Maps avec IDs Steam

**Fichiers créés/modifiés** :
```
src/lib/coaching/
├── rules.ts                    # Point d'entrée simplifié
├── exercises.ts                # Point d'entrée simplifié
├── rules/
│   ├── index.ts               # Agrégateur + utilitaires
│   ├── aim-rules.ts           # Existant
│   ├── positioning-rules.ts   # Existant
│   ├── utility-rules.ts       # Existant
│   ├── economy-rules.ts       # NOUVEAU - 5 règles
│   ├── timing-rules.ts        # NOUVEAU - 6 règles
│   └── decision-rules.ts      # NOUVEAU - 8 règles
├── exercises/
│   └── index.ts               # Base exercices enrichie
└── config/
    └── workshop-maps.ts       # NOUVEAU - IDs Workshop
```

---

## INSTRUCTION 2 - Comparaison vs Rang Cible

**État** : ✅ TERMINÉ

**Objectif** : Permettre aux utilisateurs de comparer leurs stats vs les moyennes de leur rang cible.

**Résumé** :
- Le champ `targetRank` existait déjà dans le schéma Prisma (User)
- Les benchmarks par rang existaient déjà dans `src/lib/coaching/actionable/benchmarks.ts` avec `RANK_BENCHMARKS`
- Création de `src/components/dashboard/RankComparison.tsx` - Composant UI de comparaison
- Création de `src/components/dashboard/RankComparisonWrapper.tsx` - Wrapper client pour gérer les updates
- Intégration dans `src/app/dashboard/demos/[id]/analysis/page.tsx`
- L'API route `PATCH /api/user/settings` supportait déjà `targetRank`

**Fichiers créés/modifiés** :
```
src/components/dashboard/
├── RankComparison.tsx        # NOUVEAU - Composant de comparaison
└── RankComparisonWrapper.tsx # NOUVEAU - Wrapper client

src/app/dashboard/demos/[id]/analysis/page.tsx  # MODIFIÉ - Intégration
```

**Fonctionnalités** :
- Sélecteur de rang cible (Silver → Global + Premier ranks)
- Barre de progression globale vers le rang cible
- Comparaison détaillée : Rating, ADR, KAST, HS%
- Indicateurs visuels (en dessous, moyenne, au-dessus, excellent)
- Conseils contextuels selon la progression
- Sauvegarde automatique du rang cible en DB

---

## INSTRUCTION 3 - Tests Unitaires

**État** : ⏳ À FAIRE

**Objectif** : Ajouter des tests pour garantir la fiabilité du système.

**Tâches** :
1. [ ] Installer Vitest : `npm install -D vitest @testing-library/react jsdom`
2. [ ] Créer `vitest.config.ts`
3. [ ] Tests analyseurs : `src/lib/analysis/analyzers/*.test.ts`
4. [ ] Tests coaching engine : `src/lib/coaching/engine.test.ts`
5. [ ] Tests API routes critiques

---

## INSTRUCTION 4 - Enrichir les Analyseurs

**État** : ✅ TERMINÉ

**Objectif** : Améliorer la précision des analyses avec des métriques plus détaillées.

**Résumé** :

### aim.ts - Analyse Aim Enrichie
- Analyse par catégorie d'arme (rifles, pistols, SMGs, AWP)
- Analyse du spray control (transfers, bullets to kill, spray headshots)
- Analyse des duels (won/lost, opening duels, time to kill)
- First bullet accuracy améliorée (détection des engagements)
- Crosshair score basé sur distribution des hitgroups
- Nouvelles métriques : `rifleHsRate`, `duelWinRate`, `openingDuelWinRate`, `sprayTransferSuccess`

### positioning.ts - Analyse Positionnement Enrichie
- Zones de map définies pour dust2, mirage, inferno, nuke, ancient, anubis
- Clustering des positions de mort avec types (smoke, wallbang, blind)
- Analyse de tradeability (deaths traded vs untraded)
- Analyse de qualité de position (exposed vs covered)
- Rotations détaillées (speed, distance, fast/slow)
- Nouvelles métriques : `tradeability`, `avgRotationSpeed`, `exposedDeathRate`

### utility.ts - Analyse Utilitaires Enrichie
- Flash assists (kills après flash dans les 3 secondes)
- Self-flash detection
- Smoke timing vs execute + one-way smoke detection
- Molotov : damage moyen, denial mollies (positions communes)
- HE : multi-hits detection (2+ victimes)
- Utility timing (pre-execute vs reactive vs wasted)
- Nouvelles métriques : `flashAssists`, `selfFlashes`, `oneWaySmokes`, `heMultiHits`, `wastedUtility`

**Fichiers modifiés** :
```
src/lib/analysis/analyzers/
├── aim.ts        # +380 lignes, 8 nouvelles méthodes
├── positioning.ts # +360 lignes, 10 nouvelles méthodes, zones de maps
└── utility.ts     # +360 lignes, 5 nouvelles méthodes
```

---

## INSTRUCTION 5 - Améliorer UX Gaming & Marketing

**État** : ✅ TERMINÉ

**Objectif** : Améliorer l'expérience utilisateur avec un focus gaming/esport pour CS2.

**Résumé** :

### Tailwind Config Enrichi
- 25+ animations gaming (pulse-glow, shimmer, float, bounce-subtle, shake, wiggle, etc.)
- Couleurs CS2 (ct, t, accent, ranks, scores)
- Keyframes personnalisés pour effets visuels
- Shadows avec glow effects (glow-sm, glow-md, glow-ct, glow-win, etc.)
- Font display (Orbitron) pour titres gaming

### Composants UI Gaming
- **CS2Icons.tsx** : 21 icônes SVG personnalisées (Crosshair, Headshot, Grenade, Flash, Bomb, Defuse, Economy, etc.)
- **RankBadge.tsx** : Badge de rang avec glow effects pour tous les rangs CS2 (Silver → Global + Premier)
- **GamingElements.tsx** :
  - AchievementBadge (badges déblocables avec rarity)
  - StreakCounter (compteur de série avec milestones)
  - XPBar (barre d'XP avec effet shimmer)
  - GamingStatCard (cartes stats avec hover effects)
  - MatchResult (victoire/défaite badges)
  - KillFeedEntry (style killfeed CS2)

### Composants d'Animation
- **Animations.tsx** :
  - CS2Loader (spinner crosshair, ring, dots)
  - AnimatedNumber (compteur animé au scroll)
  - ProgressRing (cercle de progression SVG)
  - Toast (notifications gaming style)
  - FadeInView (fade-in au scroll)
  - TiltCard (effet 3D au hover)
  - Skeleton loaders (stat cards)
  - PulseIndicator (indicateur live)
  - Typewriter (effet machine à écrire)
  - StaggerContainer (animation séquentielle)

### Landing Page Redesign
- Hero section avec titre animé et gradient
- Background animé avec orbs flottants
- Section stats avec icônes
- 6 features cards (aim, positioning, utility, economy, timing, decision)
- How it works en 3 étapes
- Testimonials joueurs
- CTA section avec glow effects
- Header sticky avec blur

**Fichiers créés/modifiés** :
```
tailwind.config.ts                          # MODIFIÉ - Animations, couleurs, shadows
src/components/ui/icons/CS2Icons.tsx        # NOUVEAU - 21 icônes SVG
src/components/ui/RankBadge.tsx             # NOUVEAU - Badge de rang
src/components/ui/GamingElements.tsx        # NOUVEAU - Composants gamification
src/components/ui/Animations.tsx            # NOUVEAU - Composants animation
src/app/page.tsx                            # MODIFIÉ - Landing page gaming
```

---

## INSTRUCTION 6 - UX Progressive Disclosure & Heatmaps

**État** : ✅ TERMINÉ

**Objectif** : Éviter le "data overload" en organisant l'information en couches (progressive disclosure).

**Architecture UX** :
```
┌─────────────────────────────────────────────────────────┐
│  NIVEAU 1 - Dashboard (Vue rapide)                      │
│  • Score global + 6 catégories                          │
│  • Top 3 priorités d'amélioration (InsightCard)         │
│  • Dernière performance vs moyenne                      │
└─────────────────────────────────────────────────────────┘
                          ↓ Click pour détails
┌─────────────────────────────────────────────────────────┐
│  NIVEAU 2 - Analyse Détaillée (Tabs)                    │
│  [Stats] [Heatmaps] [Timeline] [Comparaison]            │
│  • Chaque tab = un focus différent                      │
│  • Insights contextuels (pas juste des chiffres)        │
└─────────────────────────────────────────────────────────┘
                          ↓ Click pour deep-dive
┌─────────────────────────────────────────────────────────┐
│  NIVEAU 3 - Deep Dive (Modals/Pages)                    │
│  • Tous les détails pour les power users                │
│  • Filtres avancés, exports, comparaisons               │
└─────────────────────────────────────────────────────────┘
```

**Résumé** :

### Système de Tabs Enrichi (`Tabs.tsx`)
- Variantes : default, pills, underline, gaming
- Support icônes et badges
- Animation shimmer sur tab active
- InsightTabs avec barre de résumé
- keepMounted option pour performance

### Heatmap Interactive (`Heatmap.tsx`)
- Configurations pour 6 maps (dust2, mirage, inferno, nuke, ancient, anubis)
- Types de position : death, kill, flash, smoke, position
- Zoom/Pan controls
- Callouts toggle (noms des zones)
- Filtrage par type de position
- Tooltip interactif avec détails (round, arme, traded, etc.)
- Insights automatiques (zone critique, trade rate, etc.)
- Clustering pour effet heatmap
- MiniHeatmap pour preview dans les cards

### InsightCards (`InsightCard.tsx`)
- InsightCard : carte insight avec types (improvement, strength, warning, tip, achievement)
- QuickInsight : version compacte pour listes
- InsightSummary : résumé de toutes les insights
- CategoryInsight : insight par catégorie avec score
- ActionableInsight : problème + solution + exercice recommandé

### Système de Filtres (`Filters.tsx`)
- FilterChip : tags cliquables avec couleurs
- FilterGroup : groupe de filtres (multiple ou unique)
- RangeFilter : slider pour plages de valeurs
- SearchFilter : recherche avec suggestions
- SelectFilter : dropdown
- DateRangeFilter : sélection de période avec presets
- FilterBar : container avec compteur et reset

**Fichiers créés** :
```
src/components/ui/
├── Tabs.tsx               # ENRICHI - Variantes, icônes, badges, gaming
└── Filters.tsx            # NOUVEAU - Système de filtres complet

src/components/dashboard/
├── Heatmap.tsx            # NOUVEAU - Heatmap interactive + mini version
└── InsightCard.tsx        # NOUVEAU - Cards insights intelligentes
```

**Principes UX appliqués** :
- Progressive disclosure (info à la demande)
- Smart defaults (info importante en premier)
- Contextual information (insights actionnables)
- Visual hierarchy (priorités visuelles)
- Filtering (focus sur ce qui compte)

---

## INSTRUCTIONS FUTURES (Backlog)

| # | Titre | Priorité |
|---|-------|----------|
| 7 | Clips automatiques (FFmpeg) | 🟡 Phase 3 |
| 8 | Discord Bot | 🟡 Phase 3 |
| 9 | Système Premium (Stripe) | 🟡 Phase 3 |
| 10 | Replay viewer 2D | 💡 Idée |
| 11 | Timeline des rounds | 💡 Idée |

---

## Contexte Obligatoire pour IA

```
Tu travailles sur CS2 Coach, une plateforme de coaching CS2 automatisée.
Tu appliques les bonnes pratiques de développement suivantes : mxtention, modularité, clean code et réutilisabilité 

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

## Critères de Succès MVP

### Fonctionnel
- [x] User peut upload .dem et voir analyse
- [x] 6 scores catégories affichés avec détails
- [x] Règles de coaching complètes (19+ règles)
- [ ] Au moins 5 recommandations générées par analyse
- [x] Comparaison vs rang cible
- [ ] Plan hebdomadaire affiché

### Technique
- [x] 0 erreurs TypeScript
- [ ] 0 erreurs ESLint bloquantes
- [ ] Tests unitaires passent
- [ ] Docker build fonctionne

---

**Dernière mise à jour** : 2025-11-29