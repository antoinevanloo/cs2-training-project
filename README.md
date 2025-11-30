# CS2 Coach - Plateforme de Coaching Automatisée

![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

Plateforme d'analyse de démos CS2 (.dem) avec recommandations de coaching personnalisées. Uploadez vos matchs, recevez des conseils actionnables pour progresser.

## Fonctionnalités

### Analyse Complète
- **6 catégories d'analyse** : Aim, Positionnement, Utilitaires, Économie, Timing, Décision
- **Calcul HLTV Rating 2.0** : Évaluation standardisée de vos performances
- **Statistiques détaillées** : K/D, ADR, KAST, HS%, Entry kills, Clutches

### Coaching Personnalisé
- **Recommandations actionnables** : Pas juste des stats, des conseils concrets
- **Exercices Workshop Maps** : Liens vers les maps d'entraînement adaptées
- **Plan d'entraînement hebdomadaire** : Programme personnalisé selon vos faiblesses
- **Suivi de progression** : Évolution dans le temps

### Architecture Économique
- **Self-hosted** : Déployable sur VPS 5-10€/mois
- **Pas de cloud externe** : PostgreSQL local, stockage fichiers local
- **Docker ready** : Déploiement simplifié

## Stack Technique

| Technologie | Usage |
|-------------|-------|
| Next.js 14 | Frontend + API (App Router) |
| TypeScript | Typage strict |
| Tailwind CSS | Styling |
| PostgreSQL 16 | Base de données |
| Prisma 5 | ORM |
| NextAuth v5 | Authentification |
| pg-boss | Job queue (PostgreSQL native) |
| demoparser2 | Parsing demos (Python) |
| Recharts | Graphiques |
| Docker | Conteneurisation |

## Installation

### Prérequis
- Node.js 20+
- Docker & Docker Compose
- Python 3.11+ (pour le parser)

### Développement Local

```bash
# Cloner le repo
git clone https://github.com/votre-repo/cs2-coach.git
cd cs2-coach

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Démarrer la base de données
docker compose up -d db

# Appliquer les migrations
npm run db:push

# Démarrer en développement
npm run dev

# Dans un autre terminal, démarrer le worker
npm run worker
```

### Production (Docker)

```bash
# Configurer l'environnement
cp .env.example .env.local
# Générer NEXTAUTH_SECRET: openssl rand -base64 32

# Build et démarrer
docker compose up -d --build

# Voir les logs
docker compose logs -f

# Arrêter
docker compose down
```

## Configuration

### Variables d'Environnement

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@db:5432/cs2coach"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générer-avec-openssl-rand-base64-32"

# Storage
STORAGE_PATH="/data"
MAX_UPLOAD_SIZE_MB="300"
MAX_STORAGE_PER_USER_MB="500"
DEMO_RETENTION_DAYS="30"

# Jobs
JOB_CONCURRENCY="2"

# App
NODE_ENV="production"
PYTHON_PATH="python3"
```

## Structure du Projet

```
cs2-coach/
├── src/
│   ├── app/                 # Routes Next.js (App Router)
│   │   ├── (auth)/         # Pages auth (login, register)
│   │   ├── (dashboard)/    # Pages dashboard (protégées)
│   │   └── api/            # API routes
│   ├── components/         # Composants React
│   │   ├── ui/            # Composants réutilisables
│   │   ├── layout/        # Header, Sidebar
│   │   └── dashboard/     # Composants dashboard
│   └── lib/               # Logique métier
│       ├── analysis/      # Moteur d'analyse
│       ├── coaching/      # Moteur de coaching
│       ├── db/           # Prisma + queries
│       ├── jobs/         # pg-boss workers
│       └── storage/      # Gestion fichiers
├── scripts/
│   └── demo-parser/       # Parser Python
├── prisma/
│   └── schema.prisma     # Schéma DB
├── docker/               # Dockerfiles
└── docker-compose.yml
```

## Utilisation

### 1. Créer un compte
Accédez à `/register` et créez votre compte avec email/mot de passe.

### 2. Uploader une démo
- Allez sur `/dashboard/demos/upload`
- Sélectionnez votre fichier `.dem` (max 300MB)
- Attendez le traitement (2-5 minutes selon la taille)

### 3. Consulter l'analyse
- Une fois traitée, cliquez sur la démo
- Consultez vos statistiques et scores
- Accédez à l'analyse détaillée par catégorie

### 4. Suivre les recommandations
- Allez sur `/dashboard/coaching`
- Consultez vos problèmes prioritaires
- Suivez les exercices recommandés
- Appliquez le plan d'entraînement hebdomadaire

## API

### Endpoints Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/[...nextauth]` | Auth NextAuth |
| GET | `/api/demos` | Liste des démos |
| POST | `/api/demos/upload` | Upload démo |
| GET | `/api/demos/[id]` | Détail démo |
| GET | `/api/stats` | Stats agrégées utilisateur |

## Développement

### Commandes

```bash
npm run dev          # Serveur développement
npm run build        # Build production
npm run lint         # Linting ESLint
npm run worker       # Démarrer le worker

npm run db:migrate   # Créer migration
npm run db:push      # Push schema
npm run db:studio    # Interface Prisma
npm run db:seed      # Seed données test
```

### Documentation IA

Voir [CLAUDE.md](./CLAUDE.md) pour les instructions de développement avec IA.

### Ajouter un Analyseur

1. Créer `src/lib/analysis/analyzers/nouveau.ts`
2. Implémenter l'interface `Analyzer`
3. Ajouter au `src/lib/analysis/engine.ts`
4. Mettre à jour les types dans `src/lib/analysis/types.ts`

### Ajouter une Règle de Coaching

1. Éditer `src/lib/coaching/rules.ts`
2. Ajouter une règle suivant le format `CoachingRule`
3. La règle sera automatiquement évaluée par le `CoachingEngine`

## Roadmap

### Phase 1 - MVP ✅
- [x] Upload et parsing démos
- [x] 6 analyseurs complets
- [x] Calcul rating HLTV 2.0
- [x] Interface dashboard
- [ ] Enrichissement règles coaching
- [ ] Comparaison vs rang cible

### Phase 2 - Engagement
- [ ] Génération clips erreurs automatiques
- [ ] Bot Discord (résumé match)
- [ ] Challenges quotidiens personnalisés
- [ ] Système achievements

### Phase 3 - Premium
- [ ] Conservation démos étendue
- [ ] Replay viewer 2D
- [ ] Analyse équipe/premade
- [ ] Coaching IA conversationnel

## Contribuer

1. Fork le repo
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Add ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## Licence

MIT - Voir [LICENSE](./LICENSE)

## Support

- Issues: [GitHub Issues](https://github.com/votre-repo/cs2-coach/issues)
- Discord: [Lien serveur Discord]

---

Développé avec ❤️ pour la communauté CS2
