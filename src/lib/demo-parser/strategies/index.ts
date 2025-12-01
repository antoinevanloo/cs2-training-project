/**
 * Parser Strategies - Export principal
 *
 * Pattern Strategy pour la gestion des parsers de démo CS2.
 * Permet de sélectionner automatiquement le meilleur parser disponible.
 */

// Interfaces et types
export type {
  IParserStrategy,
  ParserAvailability,
  ParseOptions,
  ParseResult,
  ParserRegistry,
} from './IParserStrategy';

// Stratégies concrètes
export { ParserV2Strategy, parserV2Strategy } from './ParserV2Strategy';
export { ParserV1Strategy, parserV1Strategy } from './ParserV1Strategy';

// Context (orchestrateur)
export { ParserContext, parserContext } from './ParserContext';
export type { ParserContextOptions, ParserInfo } from './ParserContext';