import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  explainAdjustments,
  PlayerContext,
  PlayerRole,
  CS2Rank,
  CoachingThresholds,
  PLAYER_ROLES,
  MAP_CONFIGS,
  RANK_MODIFIERS,
} from '@/lib/coaching/config';

/**
 * POST /api/admin/coaching/explain
 *
 * Explique les ajustements de seuils pour une règle donnée dans un contexte spécifique
 *
 * Body:
 * {
 *   ruleId: string,
 *   category: 'aim' | 'positioning' | 'utility' | 'economy' | 'timing' | 'decision',
 *   context: {
 *     role?: PlayerRole,
 *     map?: string,
 *     rank?: CS2Rank,
 *     side?: 'ct' | 't'
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, category, context } = body;

    if (!ruleId || !category) {
      return NextResponse.json(
        { error: 'ruleId et category sont requis' },
        { status: 400 }
      );
    }

    const playerContext: PlayerContext = {
      role: context?.role as PlayerRole | undefined,
      map: context?.map,
      rank: context?.rank as CS2Rank | undefined,
      side: context?.side,
    };

    const explanation = explainAdjustments(
      ruleId,
      category as keyof CoachingThresholds,
      playerContext
    );

    return NextResponse.json({
      ruleId,
      category,
      context: playerContext,
      explanation,
    });
  } catch (error) {
    console.error('Error explaining rule:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'explication de la règle' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/coaching/explain
 *
 * Retourne la documentation complète des ajustements disponibles
 */
export async function GET() {
  try {
    const documentation = {
      roles: Object.entries(PLAYER_ROLES).map(([id, profile]) => ({
        id,
        name: profile.name,
        description: profile.description,
        expectedBehavior: profile.expectedBehavior,
        modifiedRules: Object.entries(profile.thresholdModifiers).map(
          ([ruleId, modifier]) => ({
            ruleId,
            modifier: modifier === null ? 'DÉSACTIVÉ' : `×${modifier}`,
            effect:
              modifier === null
                ? 'Règle non applicable pour ce rôle'
                : modifier > 1
                  ? 'Plus tolérant'
                  : 'Plus strict',
          })
        ),
      })),

      maps: Object.entries(MAP_CONFIGS).map(([id, config]) => ({
        id,
        name: config.name,
        isolatedZones: config.zones
          .filter((z) => z.normallyIsolated)
          .map((z) => ({
            name: z.name,
            side: z.side,
            typicalRoles: z.typicalRoles,
            description: z.description,
          })),
        rotationTimes: config.rotationTimes,
        modifiedRules: Object.entries(config.thresholdModifiers).map(
          ([ruleId, modifier]) => ({
            ruleId,
            modifier: `×${modifier}`,
            effect: modifier > 1 ? 'Plus tolérant' : 'Plus strict',
          })
        ),
        dangerZones: config.dangerZones,
      })),

      ranks: Object.entries(RANK_MODIFIERS).map(([rank, modifiers]) => ({
        rank,
        modifiedRules: Object.entries(modifiers).map(([ruleId, modifier]) => ({
          ruleId,
          modifier: `×${modifier}`,
          effect: modifier > 1 ? 'Plus tolérant' : 'Plus strict',
        })),
      })),

      usage: {
        description:
          'Ce système ajuste automatiquement les seuils de détection en fonction du contexte du joueur.',
        examples: [
          {
            scenario: 'Un lurker isolé',
            context: { role: 'lurker' },
            result:
              'La règle "isolated_death_rate" est désactivée car être isolé est normal pour un lurker.',
          },
          {
            scenario: 'Un entry fragger qui meurt souvent',
            context: { role: 'entry' },
            result:
              'Les seuils de "dying_too_fast" et "repeated_death_positions" sont plus tolérants.',
          },
          {
            scenario: 'Rotations sur Nuke',
            context: { map: 'de_nuke' },
            result:
              'Le seuil de "late_rotations" est multiplié par 2 car Nuke a des rotations très longues.',
          },
          {
            scenario: 'Joueur Silver',
            context: { rank: 'silver' },
            result:
              'Tous les seuils d\'aim sont plus tolérants (×1.3 à ×1.5) pour s\'adapter au niveau.',
          },
        ],
      },
    };

    return NextResponse.json(documentation);
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la documentation' },
      { status: 500 }
    );
  }
}