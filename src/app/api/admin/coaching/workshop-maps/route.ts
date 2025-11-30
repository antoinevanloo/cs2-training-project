import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/guard';
import {
  WORKSHOP_MAPS_CONFIG,
  getWorkshopMapsStats,
  type WorkshopMapConfig,
} from '@/lib/coaching/config/workshop-maps';

/**
 * GET /api/admin/coaching/workshop-maps
 * Récupère la liste des Workshop Maps avec leurs statuts
 */
export async function GET() {
  const admin = await requireAdminAPI();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = getWorkshopMapsStats();

    return NextResponse.json({
      maps: WORKSHOP_MAPS_CONFIG,
      stats,
    });
  } catch (error) {
    console.error('Error fetching workshop maps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workshop maps' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coaching/workshop-maps
 * Met à jour un ou plusieurs Workshop Maps
 *
 * Body:
 * - action: 'update' | 'verify' | 'mark_broken'
 * - maps: Array<{ id: string, steamId?: string | null, status?: string }>
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdminAPI();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, maps } = body as {
      action: 'update' | 'verify' | 'mark_broken' | 'mark_unverified';
      maps: Array<{
        id: string;
        steamId?: string | null;
        status?: WorkshopMapConfig['status'];
      }>;
    };

    if (!action || !maps || !Array.isArray(maps)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updatedMaps: string[] = [];
    const errors: string[] = [];

    for (const mapUpdate of maps) {
      const mapConfig = WORKSHOP_MAPS_CONFIG.find((m) => m.id === mapUpdate.id);

      if (!mapConfig) {
        errors.push(`Map "${mapUpdate.id}" not found`);
        continue;
      }

      switch (action) {
        case 'update':
          if (mapUpdate.steamId !== undefined) {
            mapConfig.steamId = mapUpdate.steamId;
          }
          if (mapUpdate.status) {
            mapConfig.status = mapUpdate.status;
          }
          if (mapUpdate.steamId && mapUpdate.steamId.length > 0) {
            mapConfig.status = 'verified';
          }
          mapConfig.lastVerified = new Date().toISOString();
          updatedMaps.push(mapConfig.id);
          break;

        case 'verify':
          if (mapConfig.steamId) {
            mapConfig.status = 'verified';
            mapConfig.lastVerified = new Date().toISOString();
            updatedMaps.push(mapConfig.id);
          } else {
            errors.push(`Map "${mapConfig.name}" has no Steam ID to verify`);
          }
          break;

        case 'mark_broken':
          mapConfig.status = 'broken';
          mapConfig.lastVerified = new Date().toISOString();
          updatedMaps.push(mapConfig.id);
          break;

        case 'mark_unverified':
          mapConfig.status = 'unverified';
          updatedMaps.push(mapConfig.id);
          break;

        default:
          errors.push(`Unknown action: ${action}`);
      }
    }

    // Note: Les modifications sont en mémoire uniquement pour cette session
    // Pour une persistance permanente, il faudrait sauvegarder dans une DB ou un fichier

    return NextResponse.json({
      success: true,
      updated: updatedMaps,
      errors: errors.length > 0 ? errors : undefined,
      message: `${updatedMaps.length} map(s) updated`,
      warning:
        'Changes are in-memory only. For permanent changes, edit the config file directly.',
    });
  } catch (error) {
    console.error('Error updating workshop maps:', error);
    return NextResponse.json(
      { error: 'Failed to update workshop maps' },
      { status: 500 }
    );
  }
}