import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { loadFeaturesFromDB } from '@/lib/coaching/config/persistence';

/**
 * GET /api/coaching/features
 *
 * Retourne les catégories de coaching activées pour l'utilisateur
 * Utilisé côté client pour filtrer l'affichage des feedbacks
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const features = await loadFeaturesFromDB();

    // Retourner uniquement les catégories activées
    const enabledCategories: Record<string, boolean> = {};
    const categoryMapping: Record<string, string> = {
      aim: 'aim',
      positioning: 'positioning',
      utility: 'utility',
      economy: 'economy',
      timing: 'timing',
      decision: 'decision',
    };

    for (const [key, category] of Object.entries(features.categories)) {
      enabledCategories[key] = category.enabled;
    }

    return NextResponse.json({
      categories: enabledCategories,
      // Mapper les noms de catégories pour la correspondance avec les données d'analyse
      mapping: {
        aim: ['aim', 'Aim', 'AIM'],
        positioning: ['positioning', 'Positionnement', 'position', 'POSITIONING'],
        utility: ['utility', 'Utilitaires', 'utilities', 'UTILITY'],
        economy: ['economy', 'Économie', 'eco', 'ECONOMY'],
        timing: ['timing', 'Timing', 'TIMING'],
        decision: ['decision', 'Décisions', 'decisions', 'DECISION'],
      },
    });
  } catch (error) {
    console.error('Error fetching coaching features:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des features' },
      { status: 500 }
    );
  }
}
