/**
 * Coaching Chat Module
 *
 * Export principal pour le système de coaching conversationnel
 */

export { CoachEngine, coachEngine } from './coach-engine';
export type {
  // Messages
  MessageRole,
  ChatMessage,
  MessageMetadata,
  ChatSource,

  // Context
  CoachContext,
  PlayerStatsContext,
  AnalysisContext,
  CoachingMode,
  CoachPreferences,

  // Session
  ChatSession,
  ChatSessionSummary,

  // API
  ChatRequest,
  ChatResponse,
  SuggestedAction,

  // Personality
  CoachPersonality,

  // Knowledge
  KnowledgeEntry,
  ExerciseReference,

  // Analytics
  ChatAnalytics,
} from './types';

export { DEFAULT_COACH_PERSONALITY } from './types';
