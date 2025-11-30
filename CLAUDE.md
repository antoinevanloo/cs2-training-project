# CLAUDE.md - Instructions pour le développement IA

Ce fichier contient les directives pour Claude (ou tout autre LLM) travaillant sur ce projet.

## Contexte Projet

**CS2 Coach** est une plateforme de coaching automatisée pour Counter-Strike 2 qui analyse les fichiers .dem et fournit des recommandations personnalisées avec exercices concrets.

### Vision Produit
- **Différenciation** : Conseils actionnables, pas juste des statistiques
- **Économie** : Self-hosted, VPS 5-10€/mois, marge >80%
- **Simplicité** : Upload → Analyse → Conseils en quelques minutes

## Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js (App Router) | 14.1.0 |
| Styling | Tailwind CSS | 3.4.1 |
| Charts | Recharts | 2.12.0 |
| Auth | NextAuth.js | 4.24.7 |
| ORM | Prisma | 5.10.0 |
| Database | PostgreSQL | 16 |
| Queue | pg-boss | 9.0.3 |
| Validation | Zod | 3.22.4 |
| Demo Parser | demoparser2 (Python) | 0.10+ |
| Runtime | Node.js | 20+ |

## Architecture

```
src/
├── app/                    # Routes Next.js App Router
│   ├── (auth)/            # Groupe routes authentification
│   ├── (dashboard)/       # Groupe routes dashboard (protégées)
│   └── api/               # API Route Handlers
├── components/
│   ├── ui/                # Composants réutilisables (Button, Card, Input, etc.)
│   ├── layout/            # Header, Sidebar, Footer
│   └── dashboard/         # Composants spécifiques dashboard
├── lib/
│   ├── auth/              # Configuration NextAuth v4
│   ├── db/                # Prisma client + queries helper
│   ├── analysis/          # Moteur d'analyse (6 analyzers + calculators)
│   ├── coaching/          # Moteur coaching (rules → recommendations)
│   ├── demo-parser/       # Interface TypeScript → Python subprocess
│   ├── jobs/              # pg-boss queue + workers
│   └── storage/           # Gestion fichiers locaux
├── scripts/
│   └── demo-parser/       # Script Python demoparser2
└── docker/                # Dockerfiles app + worker
```

## Règles de Développement OBLIGATOIRES

### TypeScript

```typescript
// ✅ TOUJOURS FAIRE
- TypeScript strict mode (déjà configuré)
- Types explicites sur fonctions publiques/exportées
- Utiliser les types Prisma générés (@prisma/client)
- Préfixer variables/paramètres inutilisés avec underscore: _unusedVar
- Valider inputs avec Zod avant traitement

// ❌ JAMAIS FAIRE
- Utiliser `any` sans justification (préférer `unknown` + type guards)
- Type assertions non vérifiées (as Type)
- Ignorer les erreurs ESLint/TypeScript
- Laisser des console.log en production
```

### Next.js 14 App Router

```typescript
// ✅ PATTERNS CORRECTS
- Server Components par défaut (pas de 'use client' sauf nécessaire)
- Data fetching directement dans les Server Components
- Route groups pour organisation: (auth), (dashboard)
- Utiliser next/image pour toutes les images
- Utiliser next/link pour navigation interne

// ❌ PATTERNS INTERDITS
- getServerSideProps / getStaticProps (ancien Pages Router)
- Client-side fetching pour données initiales
- Balise <img> standard (utiliser Image de next/image)
- window/document sans vérification côté client
```

### Prisma & Database

```typescript
// ✅ BONNES PRATIQUES
- Toujours utiliser les fonctions dans lib/db/queries/
- Inclure les relations nécessaires avec `include`
- Paginer les listes longues (skip/take)
- Utiliser les transactions pour opérations multiples
- Index sur colonnes filtrées fréquemment

// Exemple pattern query
export async function getDemosByUserId(
  userId: string,
  limit = 10,
  offset = 0
): Promise<Demo[]> {
  return prisma.demo.findMany({
    where: { userId },
    include: { analysis: true, playerStats: true },
    orderBy: { matchDate: 'desc' },
    take: limit,
    skip: offset,
  });
}
```

### Authentification (NextAuth v4)

```typescript
// La configuration se trouve dans un fichier `authOptions` et est utilisée par le handler `[...nextauth]`.
// Des fonctions utilitaires sont créées pour simplifier la protection des routes.

// Pour protéger une page Server Component (pattern actuel du projet):
import { requireAuth } from '@/lib/auth/utils'; // Cet utilitaire interne utilise getServerSession

export default async function ProtectedPage() {
  const user = await requireAuth(); // Redirige si non connecté, retourne l'utilisateur de la session sinon
  // ...
}

// Pour protéger une API Route (pattern actuel du projet):
import { requireAuthAPI } from '@/lib/auth/utils'; // Cet utilitaire interne utilise getServerSession

export async function POST(req: Request) {
  const user = await requireAuthAPI();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

### Gestion des Jobs (pg-boss)

```typescript
// Les jobs sont traités par le worker séparé (docker/Dockerfile.worker)
// Définitions dans src/lib/jobs/

// Pour créer un job:
import { createJob } from '@/lib/jobs/queue';
await createJob('PROCESS_DEMO', { demoId: demo.id });

// Les workers sont dans src/lib/jobs/workers/
```

## Patterns de Code Standards

### API Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils'; // Helper custom basé sur NextAuth v4
import { z } from 'zod';

const RequestSchema = z.object({
  field: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation
    const body = await req.json();
    const validated = RequestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // 3. Logic
    const result = await doSomething(validated.data);

    // 4. Response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Server Component avec Data Fetching

```typescript
import { requireAuth } from '@/lib/auth/utils'; // Helper custom basé sur NextAuth v4
import { getData } from '@/lib/db/queries/data';

export default async function Page() {
  const user = await requireAuth();
  const data = await getData(user.id);

  return (
    <div>
      <h1>Page Title</h1>
      <ClientComponent initialData={data} />
    </div>
  );
}
```

### Client Component

```typescript
'use client';

import { useState } from 'react';

interface Props {
  initialData: DataType;
}

export function ClientComponent({ initialData }: Props) {
  const [data, setData] = useState(initialData);

  // ... interactivité
}
```

## Commandes Utiles

```bash
# Développement
npm run dev              # Serveur dev Next.js
npm run worker           # Worker pg-boss (terminal séparé)

# Database
npm run db:migrate       # Créer migration Prisma
npm run db:push          # Push schema sans migration
npm run db:studio        # Interface Prisma Studio
npm run db:seed          # Seed données test

# Build & Lint
npm run build            # Build production
npm run lint             # ESLint

# Docker
docker compose up -d --build    # Build et démarrer
docker compose logs -f app      # Logs application
docker compose logs -f worker   # Logs worker
docker compose down             # Arrêter
```

## Tests (À implémenter)

```bash
# Structure recommandée
src/
├── lib/
│   ├── analysis/
│   │   ├── analyzers/
│   │   │   ├── aim.ts
│   │   │   └── aim.test.ts      # Test unitaire
│   │   └── engine.test.ts
│   └── coaching/
│       └── engine.test.ts

# Framework recommandé: Vitest
npm install -D vitest @testing-library/react
```

## Erreurs Courantes à Éviter

### 1. Utilisation de NextAuth v4
Le projet utilise NextAuth v4. Le pattern correct est `getServerSession`.

```typescript
// ✅ CORRECT (Pattern utilisé dans le projet)
import { getServerSession } from 'next-auth';
import { authOptions } from './config'; // chemin vers vos options
const session = await getServerSession(authOptions);

// ❌ INCORRECT (Ceci est la nouvelle API v5, non utilisée ici)
import { auth } from '@/lib/auth/config';
const session = await auth();
```

### 2. Middleware avec NextAuth v4
Le middleware utilise `getToken` de `next-auth/jwt` pour vérifier la session, ce qui est un pattern valide et correct pour NextAuth v4 avec l'App Router.

```typescript
// ✅ CORRECT (Implémentation actuelle dans src/middleware.ts)
import { getToken } from 'next-auth/jwt';
// ... logique du middleware ...

// ❌ À ÉVITER
// L'ancien helper `withAuth` peut avoir des comportements inattendus avec l'App Router.
// L'approche `getToken` est plus flexible.
```

### 3. Docker + Prisma
```dockerfile
# ✅ TOUJOURS copier prisma/ AVANT npm ci
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
```

### 4. Variables Inutilisées
```typescript
// ❌ Erreur ESLint
function analyze(data: Data, unused: string) { }

// ✅ Correct
function analyze(data: Data, _unused: string) { }
```

## Modèle de Données Principal

```
User (1) ──────< (N) Demo
                      │
                      ├── (1) Analysis
                      ├── (N) DemoPlayerStats
                      └── (N) Round

User (1) ──────< (1) UserStats (cache agrégé)
```

### Flux de Données Demo

```
1. Upload .dem → API /api/demos/upload
2. Sauvegarde fichier local → lib/storage/
3. Création job PROCESS_DEMO → pg-boss
4. Worker récupère job → lib/jobs/workers/demo-processor.ts
5. Parse Python → scripts/demo-parser/parser.py
6. Analyse → lib/analysis/engine.ts (6 analyzers)
7. Coaching → lib/coaching/engine.ts (rules → recommendations)
8. Sauvegarde DB → Demo, Analysis, DemoPlayerStats, Rounds
9. Mise à jour UserStats
```

## Système d'Analyse

### 6 Catégories d'Analyse
| Catégorie | Fichier | Métriques |
|-----------|---------|-----------|
| Aim | `aim.ts` | HS%, first bullet accuracy, spray control, reaction time |
| Positioning | `positioning.ts` | Map control, death positions, rotation speed |
| Utility | `utility.ts` | Flash efficiency, smoke usage, molotov/HE damage |
| Economy | `economy.ts` | Buy decisions, save rounds, money management |
| Timing | `timing.ts` | Peek timing, trade speed, rotation timing |
| Decision | `decision.ts` | Clutch performance, retakes, aggression level |

### Calculators
| Calculator | Description |
|------------|-------------|
| `rating.ts` | HLTV 2.0 Rating approximation |
| `adr.ts` | Average Damage per Round |
| `impact.ts` | Impact score (entry kills, clutches, trades) |

## Priorités Business

### Phase 1 - MVP (Actuel)
- [x] Upload et parsing demos
- [x] 6 analyseurs
- [x] Calcul rating HLTV
- [ ] Enrichir règles coaching
- [ ] Comparaison vs rank cible

### Phase 2 - Engagement
- [ ] Clips automatiques erreurs
- [ ] Bot Discord
- [ ] Challenges quotidiens

### Phase 3 - Premium
- [ ] Conservation demos étendue
- [ ] Replay viewer 2D
- [ ] Analyse équipe
- [ ] Coaching IA conversationnel

## Ressources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js v4 Docs](https://next-auth.js.org/)
- [pg-boss](https://github.com/timgit/pg-boss)
- [demoparser2](https://github.com/LaihoE/demoparser)
- [Tailwind CSS](https://tailwindcss.com/docs)
