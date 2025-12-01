/**
 * Types pour le système de coaching IA conversationnel
 *
 * Permet des interactions naturelles avec un coach virtuel
 * qui a accès aux analyses et statistiques du joueur
 */

import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// MESSAGES
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  /** Catégorie CS2 mentionnée */
  category?: AnalysisCategory;
  /** Demo référencée */
  demoId?: string;
  /** Round spécifique */
  round?: number;
  /** Métriques citées */
  metrics?: string[];
  /** Exercices suggérés */
  exercises?: string[];
  /** Confiance de la réponse (0-100) */
  confidence?: number;
  /** Sources utilisées */
  sources?: ChatSource[];
  /** Tokens utilisés */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ChatSource {
  type: 'demo_analysis' | 'player_stats' | 'game_knowledge' | 'exercise';
  id?: string;
  description: string;
}

// ============================================
// CONTEXTE
// ============================================

export interface CoachContext {
  /** ID de l'utilisateur */
  userId: string;

  /** Nom du joueur */
  playerName: string;

  /** SteamID du joueur */
  steamId?: string;

  /** Rank actuel */
  currentRank?: string;

  /** Rank cible */
  targetRank?: string;

  /** Statistiques agrégées du joueur */
  playerStats?: PlayerStatsContext;

  /** Dernières analyses */
  recentAnalyses?: AnalysisContext[];

  /** Points forts identifiés */
  strengths?: string[];

  /** Points à améliorer */
  weaknesses?: string[];

  /** Historique de conversation (pour le contexte) */
  conversationHistory?: ChatMessage[];

  /** Mode de coaching */
  coachingMode?: CoachingMode;

  /** Préférences utilisateur */
  preferences?: CoachPreferences;
}

export interface PlayerStatsContext {
  totalMatches: number;
  winRate: number;
  avgRating: number;
  avgKD: number;
  avgADR: number;
  bestCategory: AnalysisCategory;
  worstCategory: AnalysisCategory;
  recentTrend: 'improving' | 'stable' | 'declining';
  categoryScores: Record<AnalysisCategory, number>;
}

export interface AnalysisContext {
  demoId: string;
  map: string;
  matchDate: Date;
  result: 'win' | 'loss';
  score: { team: number; opponent: number };
  rating: number;
  keyInsights: string[];
  recommendations: string[];
}

export type CoachingMode =
  | 'general'        // Conseils généraux
  | 'demo_review'    // Revue d'une démo spécifique
  | 'skill_focus'    // Focus sur une compétence
  | 'warmup'         // Routine d'échauffement
  | 'mental'         // Coaching mental
  | 'tactical';      // Conseils tactiques

export interface CoachPreferences {
  /** Niveau de détail des réponses */
  detailLevel: 'concise' | 'detailed' | 'comprehensive';
  /** Ton du coach */
  tone: 'friendly' | 'professional' | 'motivational' | 'strict';
  /** Langue */
  language: 'fr' | 'en';
  /** Inclure des exercices */
  includeExercises: boolean;
  /** Inclure des références aux pros */
  includeProReferences: boolean;
}

// ============================================
// SESSION DE CHAT
// ============================================

export interface ChatSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
  messages: ChatMessage[];
  context: CoachContext;
  topic?: string;
  summary?: string;
  isActive: boolean;
}

export interface ChatSessionSummary {
  id: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  topic?: string;
  preview: string;
}

// ============================================
// API REQUEST/RESPONSE
// ============================================

export interface ChatRequest {
  /** Message de l'utilisateur */
  message: string;

  /** ID de session (optionnel, crée une nouvelle session si absent) */
  sessionId?: string;

  /** Contexte additionnel */
  context?: Partial<CoachContext>;

  /** Mode de coaching */
  mode?: CoachingMode;

  /** ID de démo pour revue */
  demoId?: string;

  /** Catégorie focus */
  focusCategory?: AnalysisCategory;
}

export interface ChatResponse {
  /** Réponse du coach */
  message: ChatMessage;

  /** ID de session */
  sessionId: string;

  /** Suggestions de questions follow-up */
  suggestions?: string[];

  /** Actions suggérées */
  suggestedActions?: SuggestedAction[];

  /** Erreur éventuelle */
  error?: string;
}

export interface SuggestedAction {
  type: 'view_demo' | 'start_exercise' | 'view_stats' | 'compare_rank' | 'view_moment';
  label: string;
  href?: string;
  data?: Record<string, unknown>;
}

// ============================================
// PROMPTS SYSTÈME
// ============================================

export interface CoachPersonality {
  name: string;
  description: string;
  systemPrompt: string;
  greetings: string[];
  encouragements: string[];
  critiques: string[];
}

export const DEFAULT_COACH_PERSONALITY: CoachPersonality = {
  name: 'Coach',
  description: 'Un coach CS2 expérimenté et bienveillant',
  systemPrompt: `Tu es un coach CS2 professionnel et expérimenté. Tu analyses les performances des joueurs et fournis des conseils personnalisés et actionnables.

Règles:
- Sois précis et concret dans tes conseils
- Base tes recommandations sur les données disponibles
- Suggère des exercices spécifiques quand pertinent
- Reste positif mais honnête
- Adapte ton niveau de langage au joueur
- Utilise des exemples de joueurs professionnels quand pertinent

Tu as accès aux statistiques et analyses du joueur. Utilise ces données pour personnaliser tes réponses.`,
  greetings: [
    'Salut ! Prêt pour une session de coaching ?',
    'Hey ! Comment puis-je t\'aider à progresser aujourd\'hui ?',
    'Bienvenue ! Qu\'est-ce qu\'on travaille aujourd\'hui ?',
  ],
  encouragements: [
    'Continue comme ça !',
    'Tu progresses bien, garde le rythme !',
    'Excellente amélioration !',
  ],
  critiques: [
    'Ce point mérite ton attention.',
    'Voici un axe d\'amélioration important.',
    'N\'oublie pas de travailler sur cet aspect.',
  ],
};

// ============================================
// KNOWLEDGE BASE
// ============================================

export interface KnowledgeEntry {
  id: string;
  category: 'aim' | 'positioning' | 'utility' | 'economy' | 'timing' | 'decision' | 'mental' | 'warmup';
  topic: string;
  content: string;
  tags: string[];
  rankRange?: { min: string; max: string };
  exercises?: ExerciseReference[];
}

export interface ExerciseReference {
  id: string;
  name: string;
  workshopId?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}

// ============================================
// ANALYTICS
// ============================================

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  avgSessionDuration: number;
  topTopics: Array<{ topic: string; count: number }>;
  mostAskedQuestions: Array<{ question: string; count: number }>;
  satisfactionRate?: number;
}
