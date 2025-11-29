import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  WORKSHOP_MAPS,
  COMMUNITY_SERVERS,
  THEORY_EXERCISES,
  findExercisesForWeakness,
  getExercisesByCategory,
  generateDailyRoutine,
} from '@/lib/coaching/actionable';
import { InsightCategory } from '@/lib/coaching/actionable/types';

/**
 * GET /api/coaching/exercises
 *
 * Récupère les exercices disponibles.
 *
 * Query params:
 * - category: Filtrer par catégorie (aim, positioning, utility, etc.)
 * - weakness: Rechercher par faiblesse spécifique
 * - difficulty: Filtrer par difficulté (beginner, intermediate, advanced)
 * - type: Filtrer par type (workshop_map, community_server, theory)
 * - routine: Si "true", génère une routine quotidienne
 * - totalTime: Temps total pour la routine (défaut: 45)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as InsightCategory | null;
    const weakness = searchParams.get('weakness');
    const difficulty = searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' | null;
    const type = searchParams.get('type');
    const wantRoutine = searchParams.get('routine') === 'true';
    const totalTime = parseInt(searchParams.get('totalTime') || '45', 10);

    // Si on veut une routine quotidienne
    if (wantRoutine && category) {
      const routine = generateDailyRoutine({
        totalTime,
        focusCategory: category,
        difficulty: difficulty || 'intermediate',
        includeWarmup: true,
      });

      return NextResponse.json({
        success: true,
        routine,
      });
    }

    // Si on cherche par faiblesse
    if (weakness && category) {
      const matches = findExercisesForWeakness(
        weakness,
        category,
        difficulty || 'intermediate',
        10
      );

      return NextResponse.json({
        success: true,
        exercises: matches.map((m) => ({
          ...m.exercise,
          relevanceScore: m.relevanceScore,
          matchReason: m.matchReason,
        })),
        meta: {
          weakness,
          category,
          difficulty,
          totalFound: matches.length,
        },
      });
    }

    // Si on filtre par catégorie
    if (category) {
      const exercises = getExercisesByCategory(category, difficulty || undefined);

      return NextResponse.json({
        success: true,
        exercises,
        meta: {
          category,
          difficulty,
          totalFound: exercises.length,
        },
      });
    }

    // Sinon, retourner tous les exercices
    let workshopMaps = [...WORKSHOP_MAPS];
    let communityServers = [...COMMUNITY_SERVERS];
    let theoryExercises = [...THEORY_EXERCISES];

    // Filtrer par difficulté
    if (difficulty) {
      workshopMaps = workshopMaps.filter((m) => m.difficulty === difficulty);
      communityServers = communityServers.filter((s) => s.difficulty === difficulty);
      theoryExercises = theoryExercises.filter((t) => t.difficulty === difficulty);
    }

    // Filtrer par type
    if (type) {
      if (type === 'workshop_map') {
        communityServers = [];
        theoryExercises = [];
      } else if (type === 'community_server') {
        workshopMaps = [];
        theoryExercises = [];
      } else if (type === 'theory') {
        workshopMaps = [];
        communityServers = [];
      }
    }

    return NextResponse.json({
      success: true,
      workshopMaps: workshopMaps.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        difficulty: m.difficulty,
        duration: m.estimatedDuration,
        steamId: m.steamId,
        url: m.url,
        tags: m.tags,
      })),
      communityServers: communityServers.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        difficulty: s.difficulty,
        duration: s.suggestedDuration,
        howToFind: s.howToFind,
        tags: s.tags,
      })),
      theoryExercises: theoryExercises.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        duration: t.estimatedDuration,
        type: t.type,
      })),
      meta: {
        totalWorkshopMaps: workshopMaps.length,
        totalCommunityServers: communityServers.length,
        totalTheoryExercises: theoryExercises.length,
        filters: { difficulty, type },
      },
    });
  } catch (error) {
    console.error('Erreur récupération exercices:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des exercices' },
      { status: 500 }
    );
  }
}