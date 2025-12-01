/**
 * Parser Context - Orchestrateur du Strategy Pattern
 *
 * Gère la sélection automatique du parser approprié:
 * 1. Tente d'abord le parser avec la priorité la plus élevée (v2)
 * 2. Si indisponible, passe au suivant (v1)
 * 3. Retourne le résultat avec information sur le parser utilisé
 */

import type {
  IParserStrategy,
  ParserAvailability,
  ParseOptions,
  ParseResult,
  ParserRegistry,
} from './IParserStrategy';
import { parserV2Strategy } from './ParserV2Strategy';
import { parserV1Strategy } from './ParserV1Strategy';

export interface ParserContextOptions {
  /** Forcer l'utilisation d'un parser spécifique */
  forceParser?: string;
  /** Désactiver le fallback automatique */
  disableFallback?: boolean;
  /** Callback pour logging */
  onLog?: (message: string) => void;
}

export interface ParserInfo {
  id: string;
  version: string;
  priority: number;
  description: string;
  available: boolean;
  reason?: string;
}

export class ParserContext {
  private readonly registry: ParserRegistry = new Map();
  private cachedAvailability: Map<string, ParserAvailability> = new Map();
  private availabilityChecked = false;

  constructor() {
    // Enregistrer les parsers par défaut
    this.registerParser(parserV2Strategy);
    this.registerParser(parserV1Strategy);
  }

  /**
   * Enregistre un parser dans le registre
   */
  registerParser(parser: IParserStrategy): void {
    this.registry.set(parser.id, parser);
    this.availabilityChecked = false; // Reset cache
  }

  /**
   * Obtient la liste des parsers triés par priorité
   */
  private getParsersByPriority(): IParserStrategy[] {
    return Array.from(this.registry.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Vérifie la disponibilité de tous les parsers
   */
  async checkAllParsers(): Promise<ParserInfo[]> {
    const parsers = this.getParsersByPriority();
    const results: ParserInfo[] = [];

    for (const parser of parsers) {
      const availability = await parser.checkAvailability();
      this.cachedAvailability.set(parser.id, availability);

      results.push({
        id: parser.id,
        version: parser.version,
        priority: parser.priority,
        description: parser.description,
        available: availability.available,
        reason: availability.reason,
      });
    }

    this.availabilityChecked = true;
    return results;
  }

  /**
   * Sélectionne le meilleur parser disponible
   */
  async selectBestParser(options?: ParserContextOptions): Promise<IParserStrategy | null> {
    const parsers = this.getParsersByPriority();

    // Forcer un parser spécifique
    if (options?.forceParser) {
      const forced = this.registry.get(options.forceParser);
      if (forced) {
        const availability = await forced.checkAvailability();
        if (availability.available) {
          return forced;
        }
        options?.onLog?.(
          `Parser forcé '${options.forceParser}' non disponible: ${availability.reason}`
        );
        if (options?.disableFallback) {
          return null;
        }
      }
    }

    // Sélectionner le premier parser disponible
    for (const parser of parsers) {
      let availability = this.cachedAvailability.get(parser.id);

      if (!availability) {
        availability = await parser.checkAvailability();
        this.cachedAvailability.set(parser.id, availability);
      }

      if (availability.available) {
        options?.onLog?.(`Parser sélectionné: ${parser.id} (v${parser.version})`);
        return parser;
      }

      options?.onLog?.(
        `Parser ${parser.id} non disponible: ${availability.reason}`
      );
    }

    return null;
  }

  /**
   * Parse une démo avec sélection automatique du parser
   */
  async parse(
    demoPath: string,
    parseOptions?: ParseOptions,
    contextOptions?: ParserContextOptions
  ): Promise<ParseResult> {
    const startTime = Date.now();

    // Sélectionner le parser
    const parser = await this.selectBestParser(contextOptions);

    if (!parser) {
      return {
        success: false,
        error: 'Aucun parser disponible. Vérifiez l\'installation de Python et demoparser2.',
        parserVersion: 'none',
        parseTimeMs: Date.now() - startTime,
      };
    }

    contextOptions?.onLog?.(`Parsing avec ${parser.id}...`);

    // Parser la démo
    const result = await parser.parse(demoPath, parseOptions);

    // Si échec et fallback activé, essayer le suivant
    if (!result.success && !contextOptions?.disableFallback) {
      const parsers = this.getParsersByPriority();
      const currentIndex = parsers.findIndex((p) => p.id === parser.id);

      for (let i = currentIndex + 1; i < parsers.length; i++) {
        const fallbackParser = parsers[i];
        const availability = await fallbackParser.checkAvailability();

        if (availability.available) {
          contextOptions?.onLog?.(
            `Fallback vers ${fallbackParser.id} après échec de ${parser.id}`
          );
          return fallbackParser.parse(demoPath, parseOptions);
        }
      }
    }

    return result;
  }

  /**
   * Valide un fichier avec le parser sélectionné
   */
  async validateFile(
    demoPath: string,
    contextOptions?: ParserContextOptions
  ): Promise<{ valid: boolean; error?: string }> {
    const parser = await this.selectBestParser(contextOptions);

    if (!parser) {
      return { valid: false, error: 'Aucun parser disponible' };
    }

    return parser.validateFile(demoPath);
  }

  /**
   * Obtient des informations sur le système de parsing
   */
  async getSystemInfo(): Promise<{
    parsers: ParserInfo[];
    selectedParser: string | null;
    pythonPath: string;
  }> {
    const parsers = await this.checkAllParsers();
    const selected = await this.selectBestParser();

    return {
      parsers,
      selectedParser: selected?.id || null,
      pythonPath: process.env.PYTHON_PATH || 'python3',
    };
  }
}

// Singleton exporté
export const parserContext = new ParserContext();