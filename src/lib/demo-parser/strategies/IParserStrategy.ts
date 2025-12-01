/**
 * Interface Strategy pour les parsers de démo CS2
 *
 * Pattern Strategy permettant d'interchanger les implémentations
 * de parsers (v1, v2) de manière transparente.
 */

import type { ParsedDemoDataV2 } from '../types-v2';

/**
 * Résultat de la vérification de disponibilité
 */
export interface ParserAvailability {
  available: boolean;
  version: string;
  reason?: string;
}

/**
 * Options de parsing communes
 */
export interface ParseOptions {
  /** Extraire les données de tirs (nécessaire pour movement analysis) */
  extractWeaponFires?: boolean;
  /** Extraire les positions continues (lourd) */
  extractPositions?: boolean;
  /** Taux d'échantillonnage des positions */
  positionSampleRate?: number;
  /** Timeout en millisecondes */
  timeout?: number;
}

/**
 * Résultat du parsing
 */
export interface ParseResult {
  success: boolean;
  data?: ParsedDemoDataV2;
  error?: string;
  parserVersion: string;
  parseTimeMs: number;
}

/**
 * Interface commune pour tous les parsers
 *
 * Chaque parser (v1, v2, futur v3...) doit implémenter cette interface.
 * Le Context sélectionnera automatiquement le parser approprié.
 */
export interface IParserStrategy {
  /** Identifiant unique du parser */
  readonly id: string;

  /** Version du parser */
  readonly version: string;

  /** Priorité (plus élevé = prioritaire) */
  readonly priority: number;

  /** Description du parser */
  readonly description: string;

  /**
   * Vérifie si le parser est disponible et fonctionnel
   * @returns Disponibilité et raison si indisponible
   */
  checkAvailability(): Promise<ParserAvailability>;

  /**
   * Parse un fichier .dem
   * @param demoPath Chemin vers le fichier .dem
   * @param options Options de parsing
   * @returns Résultat du parsing avec données ParsedDemoDataV2
   */
  parse(demoPath: string, options?: ParseOptions): Promise<ParseResult>;

  /**
   * Valide un fichier .dem avant parsing
   * @param demoPath Chemin vers le fichier
   * @returns true si le fichier semble valide
   */
  validateFile(demoPath: string): Promise<{ valid: boolean; error?: string }>;
}

/**
 * Type pour le registre des parsers
 */
export type ParserRegistry = Map<string, IParserStrategy>;