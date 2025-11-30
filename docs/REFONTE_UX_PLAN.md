# Plan de Refonte UX - CS2 Coach

## Problématique Actuelle

### Confusions Identifiées
1. **Mélange des granularités** : L'utilisateur ne distingue pas clairement :
   - Statistiques/coaching **général** (toutes démos)
   - Statistiques/coaching **par map** (agrégé par map)
   - Statistiques/coaching **par démo** (une partie spécifique)

2. **Manque de transparence sur les calculs** :
   - Comment est calculé le Rating ? L'ADR ? Le KAST ?
   - À quelle échelle ? (round, démo, agrégé)
   - D'où viennent les benchmarks ?

3. **Navigation incohérente** :
   - Pages dispersées sans hiérarchie claire
   - Pas de sens de lecture logique

---

## Architecture UX Proposée

### Principe Fondamental : Hiérarchie de Granularité

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NIVEAU 1 : GLOBAL                            │
│  Vue d'ensemble de TOUTES les performances (agrégé)                 │
│  → "Comment je joue en général ?"                                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NIVEAU 2 : PAR MAP                              │
│  Performance spécifique à chaque map (agrégé par map)               │
│  → "Comment je joue sur Dust2 vs Mirage ?"                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NIVEAU 3 : PAR DÉMO                             │
│  Analyse détaillée d'une partie spécifique                          │
│  → "Que s'est-il passé dans cette partie ?"                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NIVEAU 4 : PAR ROUND                            │
│  Événements précis d'un round (kills, morts, utilitaires)           │
│  → "Pourquoi j'ai perdu ce round ?"                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Navigation Principale Restructurée

```
/dashboard
├── /overview              → Niveau 1 : Vue globale (HOME)
│   ├── Statistiques générales
│   ├── Progression globale (graphique)
│   ├── Points forts/faibles récurrents
│   └── Coaching général (faiblesses systémiques)
│
├── /maps                  → Niveau 2 : Vue par map
│   ├── /maps              → Grille de toutes les maps avec stats
│   └── /maps/[mapName]    → Détail d'une map spécifique
│       ├── Statistiques de la map
│       ├── Heatmaps agrégées
│       ├── Tendances sur cette map
│       └── Coaching spécifique map
│
├── /demos                 → Niveau 3 : Vue par démo
│   ├── /demos             → Liste des démos
│   └── /demos/[id]        → Détail d'une démo
│       ├── Résumé de la partie
│       ├── 6 catégories d'analyse
│       ├── Coaching spécifique partie
│       └── /demos/[id]/rounds  → Niveau 4 : Timeline rounds
│
├── /coaching              → Centre de coaching (transversal)
│   ├── Synthèse des recommandations
│   ├── Plan d'entraînement actif
│   ├── Exercices suggérés
│   └── Objectifs et progression
│
└── /settings              → Paramètres
    ├── Configuration features
    └── Préférences affichage
```

---

## Système d'Indicateurs de Granularité

### Badges Visuels de Contexte

Chaque métrique affichée doit indiquer son niveau de calcul :

```tsx
// Composant Badge de Granularité
interface GranularityBadge {
  level: 'global' | 'map' | 'demo' | 'round';
  tooltip: string;
}

// Exemples visuels
🌐 Global    → "Calculé sur toutes vos parties"
🗺️ Map       → "Calculé sur toutes vos parties Dust2"
📄 Démo      → "Calculé sur cette partie uniquement"
⏱️ Round     → "Données de ce round spécifique"
```

### Implémentation UI

```
┌────────────────────────────────────────┐
│  Rating HLTV 2.0                       │
│  ┌──────┐                              │
│  │ 1.24 │  🌐 Global  ⓘ               │
│  └──────┘                              │
│  Tendance: ↑ +0.08 ce mois             │
└────────────────────────────────────────┘
         │
         │ (clic sur ⓘ)
         ▼
┌────────────────────────────────────────┐
│ ℹ️ Rating HLTV 2.0                      │
├────────────────────────────────────────┤
│ Formule:                               │
│ 0.0073×KAST + 0.3591×KPR - 0.5329×DPR  │
│ + 0.2372×Impact + 0.0032×ADR + 0.1587  │
├────────────────────────────────────────┤
│ Niveau de calcul: 🌐 Global            │
│ Basé sur: 47 parties analysées         │
├────────────────────────────────────────┤
│ Interprétation:                        │
│ • < 0.85 : En dessous de la moyenne    │
│ • 0.85-1.05 : Moyenne                  │
│ • 1.05-1.20 : Bon                      │
│ • > 1.20 : Excellent                   │
├────────────────────────────────────────┤
│ [Voir par map] [Voir par démo]         │
└────────────────────────────────────────┘
```

---

## Dictionnaire des Métriques avec Explications

### Métriques de Performance (Niveau Joueur)

| Métrique | Abréviation | Formule | Granularités Disponibles |
|----------|-------------|---------|-------------------------|
| Rating HLTV 2.0 | Rating | `0.0073×KAST + 0.3591×KPR - 0.5329×DPR + 0.2372×Impact + 0.0032×ADR + 0.1587` | Global, Map, Démo |
| Average Damage per Round | ADR | `Total Dégâts / Nombre de Rounds` | Global, Map, Démo, Round |
| Kill Assist Survive Trade | KAST | `(Rounds avec K ou A ou S ou T) / Total Rounds × 100` | Global, Map, Démo |
| Headshot Percentage | HS% | `Headshots / Kills × 100` | Global, Map, Démo |
| Kills per Round | KPR | `Kills / Rounds` | Global, Map, Démo |
| Deaths per Round | DPR | `Deaths / Rounds` | Global, Map, Démo |
| Kill/Death Ratio | K/D | `Kills / Deaths` | Global, Map, Démo |
| Win Rate | WR% | `Wins / (Wins + Losses) × 100` | Global, Map |

### Scores d'Analyse (6 Catégories)

| Score | Composantes | Poids | Granularités |
|-------|-------------|-------|--------------|
| **Aim Score** | HS%, First Bullet Accuracy, Spray Control, Reaction Time, Crosshair Placement | Variable selon rank | Démo (agrégeable) |
| **Positioning Score** | Map Control, Rotation Speed, Death Positions, Isolation Rate | Variable | Démo (agrégeable) |
| **Utility Score** | Flash Efficiency, Smoke Usage, Molotov Damage, HE Damage | Variable | Démo (agrégeable) |
| **Economy Score** | Buy Decisions, Save Compliance, Money Management | Variable | Démo (agrégeable) |
| **Timing Score** | Peek Timing, Trade Speed, Rotation Timing | Variable | Démo (agrégeable) |
| **Decision Score** | Clutch Performance, Retake Decisions, Aggression Level | Variable | Démo (agrégeable) |

### Métriques Détaillées par Catégorie

#### Aim (Visée)
| Métrique | Description | Calcul | Benchmark Silver | Benchmark Global |
|----------|-------------|--------|------------------|------------------|
| HS% | Pourcentage de kills par headshot | `Headshots / Kills × 100` | 35-40% | 50-55% |
| First Bullet Accuracy | Précision du premier tir | Premier hit / Premier tir | 25-30% | 45-50% |
| Spray Control | Maîtrise des rafales | Score basé sur groupement | 40/100 | 75/100 |
| Reaction Time | Temps de réaction moyen | ms entre visibilité et tir | 350ms | 200ms |
| Crosshair Placement | Placement du viseur | Score basé sur ajustement nécessaire | 50/100 | 80/100 |

#### Positioning (Positionnement)
| Métrique | Description | Calcul |
|----------|-------------|--------|
| Map Control | Contrôle des zones | % zones visitées/contrôlées |
| Rotation Speed | Vitesse de rotation | Distance moyenne / temps |
| Isolation Death Rate | Morts isolées | Morts sans trade possible / Total morts |
| Trade-able Positions | Positions échangeables | Morts depuis position tradeable / Total |
| Zone Control Time | Temps de contrôle zone | Secondes par zone |

#### Utility (Utilitaires)
| Métrique | Description | Calcul |
|----------|-------------|--------|
| Flash Efficiency | Efficacité des flashs | Ennemis aveuglés / Flashs lancés |
| Smoke Value | Valeur des smokes | Score basé sur timing/placement |
| Utility Damage | Dégâts utilitaires | Dégâts molotov + HE |
| Utility on Death | Utilité à la mort | Utilitaires non utilisés à la mort |
| Flashbangs/Match | Flashs par match | Moyenne flashs utilisés |

#### Economy (Économie)
| Métrique | Description | Calcul |
|----------|-------------|--------|
| Buy Decision Score | Score de décision d'achat | Achats corrects / Total achats |
| Save Compliance | Respect des saves | Saves corrects / Situations de save |
| Eco Round Impact | Impact en éco | K/D ratio en rounds éco |
| Money at Death | Argent à la mort | Moyenne $ non dépensés |
| Team Economy Impact | Impact économie équipe | Contribution aux achats team |

#### Timing
| Métrique | Description | Calcul |
|----------|-------------|--------|
| Peek Timing | Timing des peeks | Score basé sur timing optimal |
| Trade Speed | Vitesse de trade | ms entre mort allié et trade |
| Trade Success | Réussite des trades | Trades réussis / Opportunités |
| Rotation Timing | Timing rotations | Score (early/on-time/late) |
| Prefire Rate | Taux de prefire | Prefires / Opportunités |

#### Decision (Décisions)
| Métrique | Description | Calcul |
|----------|-------------|--------|
| Clutch Win Rate | Taux de clutchs gagnés | Clutchs gagnés / Tentatives |
| Clutch Attempts | Tentatives de clutch | Situations 1vX |
| Entry Success | Succès entries | Entry kills gagnés / Tentatives |
| Aggression Level | Niveau d'agressivité | Classification (Passive/Balanced/Aggressive) |
| Risk Assessment | Évaluation risques | Score (Calculated/Reckless) |

---

## Composant Info-Bulle Universel

### Structure TypeScript

```typescript
// src/lib/metrics/definitions.ts

export interface MetricDefinition {
  id: string;
  name: string;
  shortName: string;
  category: 'performance' | 'aim' | 'positioning' | 'utility' | 'economy' | 'timing' | 'decision';

  // Explication
  description: string;
  formula?: string;
  interpretation: {
    low: { threshold: number; label: string; };
    average: { threshold: number; label: string; };
    good: { threshold: number; label: string; };
    excellent: { threshold: number; label: string; };
  };

  // Granularité
  availableGranularities: ('global' | 'map' | 'demo' | 'round')[];
  defaultGranularity: 'global' | 'map' | 'demo' | 'round';

  // Benchmarks par rank
  benchmarks: Record<Rank, { min: number; avg: number; max: number; }>;

  // Feature flag associée
  featureFlag?: string;

  // Formatage
  format: 'percentage' | 'decimal' | 'integer' | 'time' | 'score';
  unit?: string;
}

// Exemple
export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  rating: {
    id: 'rating',
    name: 'Rating HLTV 2.0',
    shortName: 'Rating',
    category: 'performance',
    description: 'Score global de performance basé sur la formule HLTV 2.0. Prend en compte les kills, morts, assists, dégâts et impact.',
    formula: '0.0073×KAST + 0.3591×KPR - 0.5329×DPR + 0.2372×Impact + 0.0032×ADR + 0.1587',
    interpretation: {
      low: { threshold: 0.85, label: 'En dessous de la moyenne' },
      average: { threshold: 1.0, label: 'Dans la moyenne' },
      good: { threshold: 1.15, label: 'Au-dessus de la moyenne' },
      excellent: { threshold: 1.30, label: 'Excellent' },
    },
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    benchmarks: {
      SILVER_1: { min: 0.6, avg: 0.75, max: 0.9 },
      GOLD_NOVA_1: { min: 0.8, avg: 0.95, max: 1.1 },
      // ... autres ranks
      GLOBAL_ELITE: { min: 1.1, avg: 1.25, max: 1.5 },
    },
    format: 'decimal',
  },

  adr: {
    id: 'adr',
    name: 'Average Damage per Round',
    shortName: 'ADR',
    category: 'performance',
    description: 'Moyenne de dégâts infligés par round. Indicateur direct de votre contribution aux rounds.',
    formula: 'Total Dégâts / Nombre de Rounds',
    interpretation: {
      low: { threshold: 60, label: 'Faible impact' },
      average: { threshold: 75, label: 'Impact moyen' },
      good: { threshold: 90, label: 'Bon impact' },
      excellent: { threshold: 100, label: 'Impact dominant' },
    },
    availableGranularities: ['global', 'map', 'demo', 'round'],
    defaultGranularity: 'demo',
    benchmarks: {
      SILVER_1: { min: 45, avg: 55, max: 70 },
      GOLD_NOVA_1: { min: 55, avg: 70, max: 85 },
      GLOBAL_ELITE: { min: 75, avg: 90, max: 110 },
    },
    format: 'decimal',
    unit: 'dmg/round',
  },

  // ... autres métriques
};
```

### Composant React Info-Bulle

```tsx
// src/components/ui/MetricTooltip.tsx

interface MetricDisplayProps {
  metricId: string;
  value: number;
  granularity: 'global' | 'map' | 'demo' | 'round';
  contextLabel?: string; // "sur Dust2", "partie du 15/01"
  showTrend?: boolean;
  trendValue?: number;
  comparisonRank?: Rank;
}

export function MetricDisplay({
  metricId,
  value,
  granularity,
  contextLabel,
  showTrend,
  trendValue,
  comparisonRank
}: MetricDisplayProps) {
  const metric = METRIC_DEFINITIONS[metricId];
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-name">{metric.shortName}</span>
        <GranularityBadge level={granularity} />
        <button onClick={() => setShowTooltip(true)}>
          <InfoIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="metric-value">
        <FormattedValue value={value} format={metric.format} unit={metric.unit} />
      </div>

      {showTrend && trendValue && (
        <TrendIndicator value={trendValue} />
      )}

      {contextLabel && (
        <span className="text-xs text-gray-500">{contextLabel}</span>
      )}

      {showTooltip && (
        <MetricTooltipModal
          metric={metric}
          currentValue={value}
          granularity={granularity}
          comparisonRank={comparisonRank}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  );
}
```

---

## Système de Features Configurables

### Architecture Feature Flags

```typescript
// src/lib/features/config.ts

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'coaching' | 'display' | 'export';

  // État
  enabled: boolean;
  enabledByDefault: boolean;

  // Dépendances
  requires?: string[];  // Features requises
  conflicts?: string[]; // Features incompatibles

  // Impact sur les calculs
  affectsMetrics: string[];  // Métriques impactées si désactivée
  affectsScores: string[];   // Scores recalculés si changé

  // Configuration
  config?: Record<string, unknown>;
}

export const FEATURE_DEFINITIONS: Record<string, FeatureConfig> = {
  // === ANALYSEURS ===
  'analysis.aim': {
    id: 'analysis.aim',
    name: 'Analyse Aim',
    description: 'Active l\'analyse de la visée (HS%, spray control, etc.)',
    category: 'analysis',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: ['headshotPercentage', 'firstBulletAccuracy', 'sprayControl', 'reactionTime'],
    affectsScores: ['aimScore', 'overallScore'],
  },

  'analysis.positioning': {
    id: 'analysis.positioning',
    name: 'Analyse Positionnement',
    description: 'Active l\'analyse du positionnement et des heatmaps',
    category: 'analysis',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: ['mapControl', 'rotationSpeed', 'isolationDeathRate'],
    affectsScores: ['positioningScore', 'overallScore'],
  },

  'analysis.utility': {
    id: 'analysis.utility',
    name: 'Analyse Utilitaires',
    description: 'Active l\'analyse des grenades et utilitaires',
    category: 'analysis',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: ['flashEfficiency', 'smokeUsage', 'utilityDamage'],
    affectsScores: ['utilityScore', 'overallScore'],
  },

  'analysis.economy': {
    id: 'analysis.economy',
    name: 'Analyse Économie',
    description: 'Active l\'analyse des décisions économiques',
    category: 'analysis',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: ['buyDecisionScore', 'saveCompliance', 'ecoRoundImpact'],
    affectsScores: ['economyScore', 'overallScore'],
  },

  'analysis.timing': {
    id: 'analysis.timing',
    name: 'Analyse Timing',
    description: 'Active l\'analyse des timings (peeks, trades, rotations)',
    category: 'analysis',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: ['peekTiming', 'tradeSpeed', 'rotationTiming'],
    affectsScores: ['timingScore', 'overallScore'],
  },

  'analysis.decision': {
    id: 'analysis.decision',
    name: 'Analyse Décisions',
    description: 'Active l\'analyse des décisions de jeu (clutchs, entries)',
    category: 'analysis',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: ['clutchWinRate', 'entrySuccess', 'aggressionLevel'],
    affectsScores: ['decisionScore', 'overallScore'],
  },

  // === COACHING ===
  'coaching.actionable': {
    id: 'coaching.actionable',
    name: 'Conseils Actionnables',
    description: 'Génère des recommandations avec exercices concrets',
    category: 'coaching',
    enabled: true,
    enabledByDefault: true,
    requires: ['analysis.aim', 'analysis.positioning'], // Au moins 2 analyseurs
    affectsMetrics: [],
    affectsScores: [],
  },

  'coaching.rankComparison': {
    id: 'coaching.rankComparison',
    name: 'Comparaison par Rank',
    description: 'Compare vos stats aux benchmarks de votre rank',
    category: 'coaching',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: [],
    affectsScores: [],
  },

  'coaching.weeklyPlan': {
    id: 'coaching.weeklyPlan',
    name: 'Plan Hebdomadaire',
    description: 'Génère un plan d\'entraînement personnalisé',
    category: 'coaching',
    enabled: true,
    enabledByDefault: true,
    requires: ['coaching.actionable'],
    affectsMetrics: [],
    affectsScores: [],
  },

  // === AFFICHAGE ===
  'display.heatmaps': {
    id: 'display.heatmaps',
    name: 'Heatmaps',
    description: 'Affiche les heatmaps de positions kills/morts',
    category: 'display',
    enabled: true,
    enabledByDefault: true,
    requires: ['analysis.positioning'],
    affectsMetrics: [],
    affectsScores: [],
  },

  'display.roundTimeline': {
    id: 'display.roundTimeline',
    name: 'Timeline des Rounds',
    description: 'Affiche la timeline détaillée des rounds',
    category: 'display',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: [],
    affectsScores: [],
  },

  'display.progressChart': {
    id: 'display.progressChart',
    name: 'Graphique de Progression',
    description: 'Affiche l\'évolution des stats dans le temps',
    category: 'display',
    enabled: true,
    enabledByDefault: true,
    affectsMetrics: [],
    affectsScores: [],
  },
};
```

### Recalcul des Scores avec Features Désactivées

```typescript
// src/lib/analysis/score-calculator.ts

interface ScoreCalculatorConfig {
  enabledFeatures: string[];
}

export function calculateOverallScore(
  analysis: AnalysisResult,
  config: ScoreCalculatorConfig
): number {
  const enabledAnalyzers = [
    'analysis.aim',
    'analysis.positioning',
    'analysis.utility',
    'analysis.economy',
    'analysis.timing',
    'analysis.decision'
  ].filter(f => config.enabledFeatures.includes(f));

  if (enabledAnalyzers.length === 0) {
    return 0;
  }

  // Poids dynamiques basés sur les features activées
  const weights = getAdjustedWeights(enabledAnalyzers);

  let totalScore = 0;
  let totalWeight = 0;

  if (config.enabledFeatures.includes('analysis.aim')) {
    totalScore += analysis.aimScore * weights.aim;
    totalWeight += weights.aim;
  }

  if (config.enabledFeatures.includes('analysis.positioning')) {
    totalScore += analysis.positioningScore * weights.positioning;
    totalWeight += weights.positioning;
  }

  // ... autres catégories

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

function getAdjustedWeights(enabledAnalyzers: string[]): Record<string, number> {
  // Poids de base
  const baseWeights = {
    aim: 0.25,
    positioning: 0.20,
    utility: 0.15,
    economy: 0.10,
    timing: 0.15,
    decision: 0.15,
  };

  // Redistribuer les poids des features désactivées
  const enabledCount = enabledAnalyzers.length;
  const adjustedWeights: Record<string, number> = {};

  let disabledWeight = 0;
  for (const [key, weight] of Object.entries(baseWeights)) {
    if (!enabledAnalyzers.includes(`analysis.${key}`)) {
      disabledWeight += weight;
    }
  }

  const redistribution = disabledWeight / enabledCount;

  for (const [key, weight] of Object.entries(baseWeights)) {
    if (enabledAnalyzers.includes(`analysis.${key}`)) {
      adjustedWeights[key] = weight + redistribution;
    }
  }

  return adjustedWeights;
}
```

---

## Structure des Pages Refondues

### Page Overview (Niveau 1 - Global)

```
/dashboard/overview
┌─────────────────────────────────────────────────────────────────────┐
│  🌐 VUE GLOBALE                                    [47 parties]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Rating      │ │ ADR         │ │ KAST        │ │ Win Rate    │   │
│  │ 1.12 🌐 ⓘ  │ │ 78.4 🌐 ⓘ  │ │ 67% 🌐 ⓘ   │ │ 54% 🌐 ⓘ   │   │
│  │ ↑ +0.05     │ │ ↑ +2.3      │ │ → stable    │ │ ↓ -3%       │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PROGRESSION GLOBALE                                          │   │
│  │ [Graphique ligne: Rating + OverallScore sur 3 mois]          │   │
│  │ Granularité: [Par partie ▼] [Par semaine] [Par mois]         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────┐  ┌────────────────────────────────┐    │
│  │ 6 CATÉGORIES           │  │ FAIBLESSES RÉCURRENTES 🌐      │    │
│  │ ┌──────────────────┐   │  │                                │    │
│  │ │ Aim         72/100│   │  │ ⚠️ Isolation Deaths (67%)     │    │
│  │ │ Positioning  65/100│   │  │    Vu dans 35/47 parties     │    │
│  │ │ Utility      58/100│   │  │    [Voir coaching →]          │    │
│  │ │ Economy      71/100│   │  │                                │    │
│  │ │ Timing       69/100│   │  │ ⚠️ Flash Efficiency (42%)    │    │
│  │ │ Decision     74/100│   │  │    Vu dans 28/47 parties     │    │
│  │ └──────────────────┘   │  │    [Voir coaching →]          │    │
│  │ [Voir détails →]       │  │                                │    │
│  └────────────────────────┘  └────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ COACHING GÉNÉRAL                                             │   │
│  │ Basé sur l'analyse de vos 47 parties                        │   │
│  │                                                              │   │
│  │ 🎯 Focus Principal: Positionnement                          │   │
│  │ "Vous mourez trop souvent seul, sans possibilité de trade"  │   │
│  │                                                              │   │
│  │ [Voir le plan d'entraînement complet →]                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Page Maps (Niveau 2)

```
/dashboard/maps
┌─────────────────────────────────────────────────────────────────────┐
│  🗺️ VUE PAR MAP                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ [Dust2]     │ │ [Mirage]    │ │ [Inferno]   │ │ [Anubis]    │   │
│  │ 15 parties  │ │ 12 parties  │ │ 10 parties  │ │ 6 parties   │   │
│  │ WR: 60%     │ │ WR: 50%     │ │ WR: 40%     │ │ WR: 67%     │   │
│  │ Score: 72   │ │ Score: 68   │ │ Score: 61   │ │ Score: 75   │   │
│  │ ↑ Tendance  │ │ → Stable    │ │ ↓ Tendance  │ │ → Stable    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  COMPARAISON PAR MAP                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Graphique radar: 6 scores × N maps]                         │   │
│  │                                                              │   │
│  │ Légende: [Dust2] [Mirage] [Inferno] [Anubis]                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MAP AVEC LE PLUS DE MARGE DE PROGRESSION                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 🗺️ Inferno (Score: 61/100)                                  │   │
│  │                                                              │   │
│  │ Problèmes identifiés sur cette map:                         │   │
│  │ • Positionnement B site (score: 45/100)                     │   │
│  │ • Utility usage (smokes: 38% efficacité)                    │   │
│  │                                                              │   │
│  │ [Voir analyse détaillée Inferno →]                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

/dashboard/maps/[mapName]
┌─────────────────────────────────────────────────────────────────────┐
│  🗺️ DUST2                                         [15 parties]      │
│  ← Retour aux maps                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STATISTIQUES SUR DUST2                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Rating      │ │ ADR         │ │ Win Rate    │ │ Score       │   │
│  │ 1.18 🗺️ ⓘ  │ │ 82.1 🗺️ ⓘ  │ │ 60% 🗺️ ⓘ   │ │ 72/100 🗺️   │   │
│  │ vs Global   │ │ vs Global   │ │ vs Global   │ │ vs Global   │   │
│  │ +0.06       │ │ +3.7        │ │ +6%         │ │ +4          │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  HEATMAP AGRÉGÉE DUST2                                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Heatmap avec positions kills/deaths sur 15 parties]         │   │
│  │ Filtres: [Kills ●] [Deaths ○] [Tous les côtés ▼]            │   │
│  │                                                              │   │
│  │ Zones problématiques identifiées:                           │   │
│  │ • Long A doors: 23 morts, 8 kills (ratio: 0.35)            │   │
│  │ • Mid doors: 15 morts, 5 kills (ratio: 0.33)               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TENDANCE SUR DUST2                                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Graphique: évolution des 6 scores sur les 15 parties]       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  COACHING SPÉCIFIQUE DUST2                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Recommandations basées sur vos 15 parties sur Dust2:        │   │
│  │                                                              │   │
│  │ 1. Évitez les peeks Long A doors en solo (23 morts)         │   │
│  │    → Exercice: Workshop "Aim_Botz" angle peeking            │   │
│  │                                                              │   │
│  │ 2. Améliorez vos smokes B tunnels (efficacité: 45%)         │   │
│  │    → Exercice: Workshop "Dust2 Smokes"                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  HISTORIQUE DES PARTIES SUR DUST2                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Liste des 15 démos sur Dust2 avec mini-stats]              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Page Demo (Niveau 3)

```
/dashboard/demos/[id]
┌─────────────────────────────────────────────────────────────────────┐
│  📄 PARTIE DU 15/01/2025 - DUST2                                    │
│  ← Retour aux démos                                                 │
│                                                                     │
│  [Résumé] [Analyse] [Rounds] [Coaching]  ← Tabs navigation          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TAB: RÉSUMÉ                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Score: 13-11 (Victoire)                                      │   │
│  │ Durée: 45 min | 24 rounds                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  VOS STATS CETTE PARTIE                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ K/D/A       │ │ Rating      │ │ ADR         │ │ HS%         │   │
│  │ 22/15/4     │ │ 1.28 📄 ⓘ  │ │ 91.2 📄 ⓘ  │ │ 52% 📄 ⓘ   │   │
│  │             │ │ vs Moy: +0.16│ │ vs Moy: +12.8│ │ vs Moy: +7%│   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  SCORES D'ANALYSE                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ Aim: 78     │ │ Pos: 62     │ │ Util: 55    │                   │
│  │ vs Moy: +6  │ │ vs Moy: -3  │ │ vs Moy: -3  │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ Eco: 70     │ │ Tim: 68     │ │ Dec: 75     │                   │
│  │ vs Moy: -1  │ │ vs Moy: -1  │ │ vs Moy: +1  │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│                                                                     │
│  POINTS CLÉS DE CETTE PARTIE                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✅ Points forts:                                             │   │
│  │    • Aim solide (78/100) - HS% au-dessus de votre moyenne   │   │
│  │    • Bonnes décisions de clutch (2/3 gagnés)                │   │
│  │                                                              │   │
│  │ ⚠️ À améliorer:                                              │   │
│  │    • 6 morts isolées (non tradeables)                       │   │
│  │    • Flash efficiency faible (35%)                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Voir analyse détaillée →] [Voir coaching spécifique →]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

/dashboard/demos/[id]/rounds (Niveau 4)
┌─────────────────────────────────────────────────────────────────────┐
│  ⏱️ TIMELINE DES ROUNDS - Partie du 15/01/2025                      │
│  ← Retour à la partie                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RÉSUMÉ PAR PHASE                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                    │
│  │ CT Side (R1-12)    │  │ T Side (R13-24)    │                    │
│  │ Score: 7-5         │  │ Score: 6-6         │                    │
│  │ Rating: 1.35       │  │ Rating: 1.21       │                    │
│  └────────────────────┘  └────────────────────┘                    │
│                                                                     │
│  TIMELINE VISUELLE                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ R1  R2  R3  R4  R5  R6  R7  R8  R9  R10 R11 R12              │   │
│  │ [W] [W] [L] [W] [L] [W] [W] [L] [L] [W] [W] [L]              │   │
│  │ 2K  1K  0K  3K  1K  2K  1K  0K  1K  2K  1K  0K               │   │
│  │                                                              │   │
│  │ R13 R14 R15 R16 R17 R18 R19 R20 R21 R22 R23 R24              │   │
│  │ [W] [L] [W] [W] [L] [L] [W] [W] [L] [W] [W] [L]              │   │
│  │ 2K  0K  1K  2K  1K  0K  2K  1K  0K  1K  2K  0K               │   │
│  │                                                              │   │
│  │ [Cliquez sur un round pour voir le détail]                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DÉTAIL ROUND 4 (sélectionné)                              ⏱️ R4   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Résultat: Victoire (Bomb Defused)                           │   │
│  │ Votre performance: 3K 0D                                    │   │
│  │ Économie: Full buy ($4,500)                                 │   │
│  │                                                              │   │
│  │ Timeline du round:                                          │   │
│  │ 0:45 - Vous tuez "Player1" (AK47, Headshot)                │   │
│  │ 0:38 - Vous tuez "Player2" (AK47, Body)                    │   │
│  │ 0:25 - Flash assist sur "Player3" (flashé par vous)        │   │
│  │ 0:15 - Vous tuez "Player3" (AK47, Headshot) - Trade         │   │
│  │ 0:05 - Bombe désamorcée                                     │   │
│  │                                                              │   │
│  │ [Mini heatmap du round]                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ROUNDS PROBLÉMATIQUES IDENTIFIÉS                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Round 8: Mort isolée en eco-round (erreur de timing)     │   │
│  │ ⚠️ Round 15: Flash gaspillé + mort sans trade               │   │
│  │ ⚠️ Round 22: Mauvaise décision de peek en 1v2               │   │
│  │                                                              │   │
│  │ [Voir coaching pour ces erreurs →]                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Page Coaching (Transversal)

```
/dashboard/coaching
┌─────────────────────────────────────────────────────────────────────┐
│  🎯 CENTRE DE COACHING                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Plan actif] [Objectifs] [Historique] [Exercices]  ← Tabs          │
│                                                                     │
│  TAB: PLAN ACTIF                                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 📋 PLAN D'ENTRAÎNEMENT ACTUEL                               │   │
│  │ Basé sur: 🌐 Analyse globale (47 parties)                   │   │
│  │ Généré le: 15/01/2025 | Valide jusqu'au: 22/01/2025         │   │
│  │                                                              │   │
│  │ 🎯 Focus Principal: Positionnement (Score: 65/100)          │   │
│  │    Objectif: Réduire isolation death rate de 42% à 30%      │   │
│  │                                                              │   │
│  │ 🎯 Focus Secondaire: Utility (Score: 58/100)                │   │
│  │    Objectif: Améliorer flash efficiency de 35% à 50%        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ROUTINE QUOTIDIENNE SUGGÉRÉE                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ☀️ Warmup (15 min)                                          │   │
│  │    • Aim_Botz: 500 kills (focus crosshair placement)        │   │
│  │    • DM: 10 min                                             │   │
│  │                                                              │   │
│  │ 💪 Entraînement Principal (30 min)                          │   │
│  │    • Workshop "Positioning Practice" - 15 min               │   │
│  │    • Rewatch 2 rounds avec morts isolées - 15 min           │   │
│  │                                                              │   │
│  │ 🌙 Cooldown (10 min)                                        │   │
│  │    • Practice flashes sur votre map principale              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PROGRÈS CETTE SEMAINE                                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Isolation Death Rate: 42% → 38% (objectif: 30%) ████████░░  │   │
│  │ Flash Efficiency: 35% → 42% (objectif: 50%)     ████████░░  │   │
│  │                                                              │   │
│  │ Parties jouées cette semaine: 5                             │   │
│  │ Prochain checkpoint: Dans 3 parties                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  INSIGHTS RÉCENTS                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Dernière analyse: Partie du 18/01 sur Dust2                 │   │
│  │                                                              │   │
│  │ ✅ Amélioration: Isolation deaths en baisse (4 vs 6 moy)    │   │
│  │ ⚠️ Attention: Flash efficiency toujours faible (38%)        │   │
│  │ 💡 Conseil: Pensez à throw vos flashs AVANT les peeks       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implémentation Technique

### Phase 1 : Fondations (Semaine 1-2)

#### 1.1 Système de Métriques avec Explications
- [ ] Créer `src/lib/metrics/definitions.ts` avec toutes les définitions
- [ ] Créer `src/lib/metrics/benchmarks.ts` avec les benchmarks par rank
- [ ] Créer composant `MetricDisplay` avec tooltip intégré
- [ ] Créer composant `GranularityBadge`

#### 1.2 Système de Features
- [ ] Créer `src/lib/features/config.ts` avec définitions
- [ ] Créer `src/lib/features/hooks.ts` avec useFeature(), useEnabledFeatures()
- [ ] Modifier score-calculator pour prendre en compte features
- [ ] Ajouter page settings pour toggle features

#### 1.3 Migration Base de Données
- [ ] Ajouter table `UserFeatureConfig` pour stocker préférences
- [ ] Ajouter champ `featureConfig` dans `User`

### Phase 2 : Restructuration Navigation (Semaine 3-4)

#### 2.1 Nouvelle Architecture Pages
- [ ] Créer `/dashboard/overview` (nouveau home)
- [ ] Créer `/dashboard/maps` et `/dashboard/maps/[mapName]`
- [ ] Restructurer `/dashboard/demos/[id]` avec tabs
- [ ] Créer `/dashboard/demos/[id]/rounds`
- [ ] Restructurer `/dashboard/coaching` avec tabs

#### 2.2 Composants de Navigation
- [ ] Créer `BreadcrumbGranularity` component
- [ ] Mettre à jour Sidebar avec nouvelle structure
- [ ] Créer `GranularityContextProvider`

### Phase 3 : Composants Refondus (Semaine 5-6)

#### 3.1 Composants Stats
- [ ] Refondre `StatsOverview` avec `MetricDisplay`
- [ ] Créer `CategoryScoreCard` avec granularité
- [ ] Créer `TrendChart` multi-granularité
- [ ] Créer `HeatmapAggregated` pour vue map

#### 3.2 Composants Coaching
- [ ] Refondre `InsightCard` avec granularité source
- [ ] Créer `CoachingPlanCard`
- [ ] Créer `ProgressTracker`

### Phase 4 : Intégration & Polish (Semaine 7-8)

#### 4.1 Intégration
- [ ] Connecter tous les composants aux nouvelles APIs
- [ ] Implémenter agrégation par map dans les queries
- [ ] Tester tous les scénarios de features on/off

#### 4.2 Polish
- [ ] Animations transitions entre granularités
- [ ] Responsive design mobile
- [ ] Tests E2E parcours utilisateur

---

## Fichiers à Créer/Modifier

### Nouveaux Fichiers
```
src/
├── lib/
│   ├── metrics/
│   │   ├── definitions.ts       # Définitions métriques
│   │   ├── benchmarks.ts        # Benchmarks par rank
│   │   └── formatters.ts        # Formatage valeurs
│   ├── features/
│   │   ├── config.ts            # Config features
│   │   ├── hooks.ts             # React hooks
│   │   └── calculator.ts        # Recalcul scores
│   └── granularity/
│       ├── types.ts             # Types granularité
│       └── aggregator.ts        # Agrégation données
├── components/
│   ├── ui/
│   │   ├── MetricDisplay.tsx    # Affichage métrique
│   │   ├── MetricTooltip.tsx    # Tooltip explicatif
│   │   ├── GranularityBadge.tsx # Badge niveau
│   │   └── GranularitySelector.tsx
│   ├── dashboard/
│   │   ├── overview/
│   │   │   ├── GlobalStats.tsx
│   │   │   ├── CategoryScores.tsx
│   │   │   └── RecurringWeaknesses.tsx
│   │   └── maps/
│   │       ├── MapGrid.tsx
│   │       ├── MapDetail.tsx
│   │       └── AggregatedHeatmap.tsx
│   └── coaching/
│       ├── ActivePlan.tsx
│       ├── DailyRoutine.tsx
│       └── ProgressTracker.tsx
└── app/
    └── dashboard/
        ├── overview/
        │   └── page.tsx
        ├── maps/
        │   ├── page.tsx
        │   └── [mapName]/
        │       └── page.tsx
        └── demos/
            └── [id]/
                └── rounds/
                    └── page.tsx
```

### Fichiers à Modifier
```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx             # Redirect vers /overview
│       ├── demos/
│       │   └── [id]/
│       │       └── page.tsx     # Restructurer avec tabs
│       ├── coaching/
│       │   └── page.tsx         # Restructurer avec tabs
│       └── settings/
│           └── page.tsx         # Ajouter config features
├── components/
│   └── layout/
│       └── Sidebar.tsx          # Nouvelle navigation
└── lib/
    └── analysis/
        └── score-calculator.ts  # Support features toggle
```

---

## Tests Utilisateur à Réaliser

### Scénario 1 : Comprendre ses stats globales
1. Utilisateur arrive sur /dashboard
2. Voit immédiatement ses stats avec badge 🌐
3. Clique sur ⓘ d'une métrique
4. Comprend le calcul et l'interprétation
5. Peut naviguer vers vue par map ou par démo

### Scénario 2 : Analyser une map spécifique
1. Depuis overview, clique sur "Voir par map"
2. Voit toutes ses maps avec stats agrégées
3. Clique sur Dust2
4. Voit stats spécifiques Dust2 avec badge 🗺️
5. Voit heatmap agrégée de ses positions
6. Comprend ses problèmes sur cette map

### Scénario 3 : Comprendre une partie
1. Depuis liste démos, sélectionne une partie
2. Voit résumé avec stats badge 📄
3. Voit comparaison avec sa moyenne globale
4. Peut accéder aux rounds individuels
5. Voit timeline des rounds
6. Identifie rounds problématiques

### Scénario 4 : Désactiver une feature
1. Va dans Settings > Features
2. Désactive "Analyse Utility"
3. Les scores sont recalculés sans utility
4. Les composants utility ne s'affichent plus
5. Le coaching ne mentionne plus utility

---

## Métriques de Succès

1. **Compréhension** : Utilisateur peut expliquer d'où vient chaque métrique
2. **Navigation** : < 3 clics pour passer de global à round
3. **Cohérence** : Mêmes métriques, même calcul, partout
4. **Flexibilité** : Features toggle fonctionne sans bugs
5. **Performance** : Pages chargent en < 2s
