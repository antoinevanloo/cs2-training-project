/**
 * Moments Analysis Module
 *
 * Export principal pour la détection et gestion des moments clés
 */

export { MomentDetector, momentDetector } from './moment-detector';
export type { DemoMomentData, RoundMomentData, KillEvent } from './moment-detector';
export type {
  // Main types
  MomentType,
  MomentTag,
  MomentImportance,
  Moment,
  MomentCollection,
  MomentStats,

  // Sub-types
  MomentTiming,
  MomentPlayer,
  MomentContext,
  MomentDetails,
  MomentKill,
  ClipInfo,

  // Options & Filters
  MomentDetectionOptions,
  MomentFilter,

  // Export
  MomentExportOptions,
  MomentExport,
} from './types';
