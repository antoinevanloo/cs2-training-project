/**
 * Configuration des contextes par map CS2
 *
 * Chaque map a des zones spécifiques où certains comportements sont normaux:
 * - Positions isolées acceptables (mid Mirage, banana Inferno, etc.)
 * - Zones dangereuses connues
 * - Temps de rotation attendus
 */

export type CS2Map =
  | 'de_mirage'
  | 'de_inferno'
  | 'de_dust2'
  | 'de_nuke'
  | 'de_overpass'
  | 'de_ancient'
  | 'de_anubis'
  | 'de_vertigo';

export interface MapZone {
  name: string;
  /** Coordonnées approximatives (x_min, x_max, y_min, y_max) */
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Cette zone est normalement jouée en solo */
  normallyIsolated: boolean;
  /** Côté qui joue normalement cette zone */
  side: 'ct' | 't' | 'both';
  /** Rôles qui jouent normalement cette position */
  typicalRoles: string[];
  /** Description pour les admins */
  description: string;
}

export interface MapConfig {
  id: CS2Map;
  name: string;
  /** Zones de la map */
  zones: MapZone[];
  /** Temps de rotation moyen entre sites (secondes) */
  rotationTimes: {
    aToB: number;
    bToA: number;
    avgCT: number;
    avgT: number;
  };
  /** Modificateurs de seuils spécifiques à cette map */
  thresholdModifiers: {
    [ruleId: string]: number;
  };
  /** Positions dangereuses connues où mourir est fréquent */
  dangerZones: string[];
}

export const MAP_CONFIGS: Record<CS2Map, MapConfig> = {
  de_mirage: {
    id: 'de_mirage',
    name: 'Mirage',
    zones: [
      {
        name: 'mid',
        bounds: { xMin: -200, xMax: 200, yMin: -500, yMax: 500 },
        normallyIsolated: true,
        side: 'both',
        typicalRoles: ['awper', 'lurker'],
        description: 'Le joueur mid est souvent seul, que ce soit CT ou T',
      },
      {
        name: 'window',
        bounds: { xMin: -100, xMax: 100, yMin: 400, yMax: 600 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['awper'],
        description: 'L\'AWPer window joue seul',
      },
      {
        name: 'palace',
        bounds: { xMin: -800, xMax: -400, yMin: 800, yMax: 1200 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker', 'entry'],
        description: 'Un joueur peut lurk palace seul',
      },
      {
        name: 'apps',
        bounds: { xMin: 600, xMax: 1000, yMin: -200, yMax: 400 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker'],
        description: 'Apps peut être joué en lurk',
      },
      {
        name: 'connector',
        bounds: { xMin: 0, xMax: 400, yMin: 200, yMax: 600 },
        normallyIsolated: false,
        side: 'both',
        typicalRoles: ['rifler', 'support'],
        description: 'Connector est une zone de transition',
      },
    ],
    rotationTimes: {
      aToB: 12,
      bToA: 12,
      avgCT: 8,
      avgT: 15,
    },
    thresholdModifiers: {
      // Mirage est une map équilibrée, pas de modificateurs majeurs
      late_rotations: 1.0,
    },
    dangerZones: ['mid_window_peek', 'palace_pillar', 'default_a_site', 'van'],
  },

  de_inferno: {
    id: 'de_inferno',
    name: 'Inferno',
    zones: [
      {
        name: 'banana',
        bounds: { xMin: -1500, xMax: -1000, yMin: 500, yMax: 1500 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['rifler', 'awper'],
        description: 'Le joueur banana joue souvent seul ou en duo',
      },
      {
        name: 'pit',
        bounds: { xMin: -400, xMax: 0, yMin: 1500, yMax: 2000 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['awper'],
        description: 'Pit est souvent tenu seul',
      },
      {
        name: 'apartments',
        bounds: { xMin: 500, xMax: 1200, yMin: 0, yMax: 800 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker', 'entry'],
        description: 'Apartments peut être joué en lurk',
      },
      {
        name: 'top_mid',
        bounds: { xMin: 0, xMax: 400, yMin: 0, yMax: 500 },
        normallyIsolated: false,
        side: 'both',
        typicalRoles: ['support', 'rifler'],
        description: 'Top mid est une zone de contact',
      },
    ],
    rotationTimes: {
      aToB: 15,
      bToA: 15,
      avgCT: 10,
      avgT: 18,
    },
    thresholdModifiers: {
      // Inferno a des rotations lentes
      late_rotations: 1.3, // Plus tolérant sur les rotations
      isolated_death_rate: 1.2, // Banana player souvent seul
    },
    dangerZones: ['banana_car', 'top_banana', 'pit_corner', 'boiler'],
  },

  de_dust2: {
    id: 'de_dust2',
    name: 'Dust 2',
    zones: [
      {
        name: 'long',
        bounds: { xMin: -2000, xMax: -1000, yMin: 500, yMax: 1500 },
        normallyIsolated: true,
        side: 'both',
        typicalRoles: ['awper', 'rifler'],
        description: 'Long player est souvent seul',
      },
      {
        name: 'short',
        bounds: { xMin: -500, xMax: 0, yMin: 0, yMax: 500 },
        normallyIsolated: false,
        side: 'both',
        typicalRoles: ['rifler', 'support'],
        description: 'Short est une zone de rotation',
      },
      {
        name: 'b_tunnels',
        bounds: { xMin: 500, xMax: 1200, yMin: -500, yMax: 200 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker'],
        description: 'Tunnels lurk position',
      },
      {
        name: 'mid_doors',
        bounds: { xMin: -300, xMax: 300, yMin: -400, yMax: 400 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['awper'],
        description: 'AWP mid doors',
      },
    ],
    rotationTimes: {
      aToB: 10,
      bToA: 10,
      avgCT: 6,
      avgT: 12,
    },
    thresholdModifiers: {
      // Dust2 est rapide, rotations courtes
      late_rotations: 0.8, // Plus strict
    },
    dangerZones: ['mid_doors_cross', 'long_corner', 'car', 'default_b'],
  },

  de_nuke: {
    id: 'de_nuke',
    name: 'Nuke',
    zones: [
      {
        name: 'outside',
        bounds: { xMin: -1000, xMax: 0, yMin: -2000, yMax: -500 },
        normallyIsolated: true,
        side: 'both',
        typicalRoles: ['awper', 'lurker'],
        description: 'Outside est souvent joué en solo',
      },
      {
        name: 'ramp',
        bounds: { xMin: 500, xMax: 1200, yMin: 0, yMax: 800 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['rifler', 'awper'],
        description: 'Ramp player est souvent seul',
      },
      {
        name: 'secret',
        bounds: { xMin: -800, xMax: -200, yMin: 500, yMax: 1200 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker'],
        description: 'Secret lurk',
      },
    ],
    rotationTimes: {
      aToB: 20, // Nuke a des rotations très longues
      bToA: 8, // Sauf via vent
      avgCT: 15,
      avgT: 25,
    },
    thresholdModifiers: {
      // Nuke - rotations très longues, normal d'être isolé
      late_rotations: 2.0, // Très tolérant
      isolated_death_rate: 1.5, // Map verticale, isolement normal
      poor_map_control: 1.3, // Map complexe
    },
    dangerZones: ['silo', 'hell', 'ramp_bottom', 'mini'],
  },

  de_overpass: {
    id: 'de_overpass',
    name: 'Overpass',
    zones: [
      {
        name: 'long_a',
        bounds: { xMin: -1500, xMax: -800, yMin: 0, yMax: 800 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['awper'],
        description: 'Long A AWP position',
      },
      {
        name: 'connector',
        bounds: { xMin: -400, xMax: 400, yMin: -500, yMax: 200 },
        normallyIsolated: false,
        side: 'both',
        typicalRoles: ['rifler', 'support'],
        description: 'Zone de transition',
      },
      {
        name: 'monster',
        bounds: { xMin: 600, xMax: 1200, yMin: 500, yMax: 1200 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker', 'entry'],
        description: 'Monster lurk/entry',
      },
    ],
    rotationTimes: {
      aToB: 14,
      bToA: 14,
      avgCT: 10,
      avgT: 16,
    },
    thresholdModifiers: {
      late_rotations: 1.1,
    },
    dangerZones: ['toilets', 'party', 'monster_default', 'short'],
  },

  de_ancient: {
    id: 'de_ancient',
    name: 'Ancient',
    zones: [
      {
        name: 'mid',
        bounds: { xMin: -300, xMax: 300, yMin: -500, yMax: 500 },
        normallyIsolated: true,
        side: 'both',
        typicalRoles: ['awper', 'lurker'],
        description: 'Mid control important',
      },
      {
        name: 'donut',
        bounds: { xMin: 500, xMax: 1000, yMin: 200, yMax: 800 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['rifler'],
        description: 'Donut position',
      },
    ],
    rotationTimes: {
      aToB: 11,
      bToA: 11,
      avgCT: 7,
      avgT: 13,
    },
    thresholdModifiers: {},
    dangerZones: ['main', 'cave', 'elbow', 'ct_spawn'],
  },

  de_anubis: {
    id: 'de_anubis',
    name: 'Anubis',
    zones: [
      {
        name: 'mid',
        bounds: { xMin: -400, xMax: 400, yMin: -600, yMax: 600 },
        normallyIsolated: true,
        side: 'both',
        typicalRoles: ['awper'],
        description: 'Mid AWP battles',
      },
      {
        name: 'canal',
        bounds: { xMin: -1200, xMax: -600, yMin: 0, yMax: 600 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker'],
        description: 'Canal lurk position',
      },
    ],
    rotationTimes: {
      aToB: 10,
      bToA: 10,
      avgCT: 6,
      avgT: 12,
    },
    thresholdModifiers: {},
    dangerZones: ['connector_mid', 'palace', 'water', 'main_a'],
  },

  de_vertigo: {
    id: 'de_vertigo',
    name: 'Vertigo',
    zones: [
      {
        name: 'ramp',
        bounds: { xMin: -500, xMax: 0, yMin: 500, yMax: 1200 },
        normallyIsolated: true,
        side: 'ct',
        typicalRoles: ['rifler', 'awper'],
        description: 'Ramp solo hold',
      },
      {
        name: 'elevator',
        bounds: { xMin: 400, xMax: 800, yMin: -200, yMax: 400 },
        normallyIsolated: true,
        side: 't',
        typicalRoles: ['lurker'],
        description: 'Elevator lurk',
      },
    ],
    rotationTimes: {
      aToB: 8,
      bToA: 8,
      avgCT: 5,
      avgT: 10,
    },
    thresholdModifiers: {
      late_rotations: 0.9, // Rotations rapides sur Vertigo
    },
    dangerZones: ['a_ramp_corner', 'default_b', 'ladder_room'],
  },
};

/**
 * Détermine si une position est dans une zone normalement isolée
 */
export function isIsolatedPositionNormal(
  mapName: string,
  position: { x: number; y: number },
  side: 'ct' | 't'
): boolean {
  const mapId = mapName.toLowerCase().replace('/', '_') as CS2Map;
  const mapConfig = MAP_CONFIGS[mapId];

  if (!mapConfig) {
    return false;
  }

  for (const zone of mapConfig.zones) {
    if (zone.normallyIsolated && (zone.side === side || zone.side === 'both')) {
      const inBounds =
        position.x >= zone.bounds.xMin &&
        position.x <= zone.bounds.xMax &&
        position.y >= zone.bounds.yMin &&
        position.y <= zone.bounds.yMax;

      if (inBounds) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Retourne le temps de rotation attendu pour une map
 */
export function getExpectedRotationTime(mapName: string, side: 'ct' | 't'): number {
  const mapId = mapName.toLowerCase().replace('/', '_') as CS2Map;
  const mapConfig = MAP_CONFIGS[mapId];

  if (!mapConfig) {
    return 10; // Default
  }

  return side === 'ct' ? mapConfig.rotationTimes.avgCT : mapConfig.rotationTimes.avgT;
}

/**
 * Retourne les modificateurs de seuils pour une map
 */
export function getMapThresholdModifiers(mapName: string): { [key: string]: number } {
  const mapId = mapName.toLowerCase().replace('/', '_') as CS2Map;
  const mapConfig = MAP_CONFIGS[mapId];

  return mapConfig?.thresholdModifiers || {};
}

/**
 * Retourne toutes les configs de map pour l'affichage admin
 */
export function getMapsForAdmin(): MapConfig[] {
  return Object.values(MAP_CONFIGS);
}
