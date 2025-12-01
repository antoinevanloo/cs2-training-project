/**
 * Coach Engine - Moteur de coaching conversationnel
 *
 * Gère la logique de coaching IA avec contexte et personnalisation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ChatMessage,
  ChatSession,
  ChatRequest,
  ChatResponse,
  CoachContext,
  CoachPreferences,
  SuggestedAction,
  DEFAULT_COACH_PERSONALITY,
  CoachingMode,
  MessageMetadata,
} from './types';
import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_PREFERENCES: CoachPreferences = {
  detailLevel: 'detailed',
  tone: 'friendly',
  language: 'fr',
  includeExercises: true,
  includeProReferences: true,
};

const MAX_HISTORY_MESSAGES = 10;
const MAX_CONTEXT_TOKENS = 2000;

// ============================================
// COACH ENGINE
// ============================================

export class CoachEngine {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Traite une requête de chat et génère une réponse
   */
  async processMessage(request: ChatRequest, context: CoachContext): Promise<ChatResponse> {
    // Récupérer ou créer une session
    let session = request.sessionId ? this.sessions.get(request.sessionId) : null;

    if (!session) {
      session = this.createSession(context);
    }

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: request.message,
      timestamp: new Date(),
    };
    session.messages.push(userMessage);

    // Analyser l'intention
    const intent = this.analyzeIntent(request.message, request.mode);

    // Construire le prompt système enrichi
    const systemPrompt = this.buildSystemPrompt(context, intent, request);

    // Générer la réponse (simulée pour l'instant - sera connecté à une API LLM)
    const response = await this.generateResponse(
      systemPrompt,
      session.messages,
      context,
      intent
    );

    // Créer le message de réponse
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: response.metadata,
    };
    session.messages.push(assistantMessage);
    session.lastMessageAt = new Date();

    // Générer des suggestions
    const suggestions = this.generateSuggestions(intent, context);
    const suggestedActions = this.generateActions(intent, context, request);

    // Sauvegarder la session
    this.sessions.set(session.id, session);

    return {
      message: assistantMessage,
      sessionId: session.id,
      suggestions,
      suggestedActions,
    };
  }

  /**
   * Crée une nouvelle session de chat
   */
  private createSession(context: CoachContext): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      userId: context.userId,
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messages: [],
      context,
      isActive: true,
    };

    // Message système initial
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      role: 'system',
      content: this.getInitialSystemMessage(context),
      timestamp: new Date(),
    };
    session.messages.push(systemMessage);

    return session;
  }

  /**
   * Analyse l'intention du message
   */
  private analyzeIntent(message: string, mode?: CoachingMode): CoachingIntent {
    const lowercaseMessage = message.toLowerCase();

    // Détection de catégorie
    const categoryKeywords: Record<AnalysisCategory, string[]> = {
      aim: ['aim', 'visée', 'headshot', 'spray', 'tir', 'crosshair'],
      positioning: ['position', 'placement', 'angle', 'cover', 'rotation'],
      utility: ['flash', 'smoke', 'molotov', 'grenade', 'utilitaire', 'nade'],
      economy: ['économie', 'eco', 'buy', 'save', 'argent', 'money'],
      timing: ['timing', 'peek', 'tempo', 'rush', 'slow', 'timing'],
      decision: ['décision', 'clutch', 'retake', 'game sense', 'rotation'],
      movement: ['movement', 'mouvement', 'strafe', 'counter-strafe', 'bhop', 'déplacement'],
      awareness: ['awareness', 'conscience', 'info', 'callout', 'flash blind', 'bombe'],
      teamplay: ['teamplay', 'équipe', 'trade', 'support', 'coordination', 'entry'],
    };

    let detectedCategory: AnalysisCategory | undefined;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowercaseMessage.includes(kw))) {
        detectedCategory = category as AnalysisCategory;
        break;
      }
    }

    // Détection du type de question
    const intentTypes = {
      improvement: ['améliorer', 'progresser', 'comment', 'conseil', 'aide', 'improve', 'better'],
      analysis: ['analyse', 'stats', 'statistiques', 'performance', 'résultat'],
      exercise: ['exercice', 'entraînement', 'warmup', 'practice', 'drill'],
      explanation: ['pourquoi', 'expliquer', 'comprendre', 'why', 'explain'],
      comparison: ['comparer', 'différence', 'versus', 'vs', 'compare'],
      demo: ['demo', 'match', 'partie', 'round', 'replay'],
    };

    let intentType: IntentType = 'general';
    for (const [type, keywords] of Object.entries(intentTypes)) {
      if (keywords.some((kw) => lowercaseMessage.includes(kw))) {
        intentType = type as IntentType;
        break;
      }
    }

    // Override avec le mode si spécifié
    if (mode === 'demo_review') intentType = 'demo';
    if (mode === 'skill_focus' && detectedCategory) intentType = 'improvement';
    if (mode === 'warmup') intentType = 'exercise';

    return {
      type: intentType,
      category: detectedCategory,
      mode: mode || 'general',
      confidence: detectedCategory ? 80 : 60,
    };
  }

  /**
   * Construit le prompt système enrichi
   */
  private buildSystemPrompt(
    context: CoachContext,
    intent: CoachingIntent,
    request: ChatRequest
  ): string {
    const parts: string[] = [];

    // Personnalité de base
    parts.push(`Tu es un coach CS2 professionnel. Tu aides ${context.playerName} à progresser.`);

    // Contexte joueur
    if (context.playerStats) {
      parts.push(`
Stats du joueur:
- Matchs joués: ${context.playerStats.totalMatches}
- Win rate: ${(context.playerStats.winRate * 100).toFixed(1)}%
- Rating moyen: ${context.playerStats.avgRating.toFixed(2)}
- K/D moyen: ${context.playerStats.avgKD.toFixed(2)}
- ADR moyen: ${context.playerStats.avgADR.toFixed(0)}
- Tendance: ${context.playerStats.recentTrend}
- Point fort: ${context.playerStats.bestCategory}
- Point faible: ${context.playerStats.worstCategory}
      `);
    }

    // Rank context
    if (context.currentRank) {
      parts.push(`Rank actuel: ${context.currentRank}`);
    }
    if (context.targetRank) {
      parts.push(`Objectif: ${context.targetRank}`);
    }

    // Forces et faiblesses
    if (context.strengths?.length) {
      parts.push(`Points forts identifiés: ${context.strengths.join(', ')}`);
    }
    if (context.weaknesses?.length) {
      parts.push(`Axes d'amélioration: ${context.weaknesses.join(', ')}`);
    }

    // Préférences
    const prefs = context.preferences || DEFAULT_PREFERENCES;
    parts.push(`
Préférences:
- Niveau de détail: ${prefs.detailLevel}
- Ton: ${prefs.tone}
- Langue: ${prefs.language}
- Inclure exercices: ${prefs.includeExercises ? 'oui' : 'non'}
    `);

    // Instructions spécifiques selon l'intention
    if (intent.category) {
      parts.push(`Focus actuel: ${intent.category}`);
    }

    if (intent.type === 'exercise') {
      parts.push('Suggère des exercices concrets avec durée et difficulté.');
    }

    if (intent.type === 'demo' && request.demoId) {
      parts.push(`Analyse basée sur la démo ID: ${request.demoId}`);
    }

    return parts.join('\n');
  }

  /**
   * Génère une réponse (simulation - sera connecté à l'API LLM)
   */
  private async generateResponse(
    _systemPrompt: string,
    messages: ChatMessage[],
    context: CoachContext,
    intent: CoachingIntent
  ): Promise<{ content: string; metadata: MessageMetadata }> {
    // Pour l'instant, génère des réponses basées sur des templates
    // À remplacer par un appel à l'API OpenAI/Claude

    const userMessage = messages[messages.length - 1].content;
    let content: string;
    const metadata: MessageMetadata = {
      confidence: intent.confidence,
      category: intent.category,
    };

    // Réponses basées sur l'intention
    switch (intent.type) {
      case 'improvement':
        content = this.generateImprovementResponse(intent.category, context);
        break;
      case 'analysis':
        content = this.generateAnalysisResponse(context);
        break;
      case 'exercise':
        content = this.generateExerciseResponse(intent.category);
        metadata.exercises = ['Aim Lab - Gridshot', 'Yprac Maps'];
        break;
      case 'explanation':
        content = this.generateExplanationResponse(userMessage, intent.category);
        break;
      case 'demo':
        content = this.generateDemoResponse(context);
        break;
      default:
        content = this.generateGeneralResponse(context);
    }

    return { content, metadata };
  }

  /**
   * Génère une réponse d'amélioration
   */
  private generateImprovementResponse(
    category: AnalysisCategory | undefined,
    context: CoachContext
  ): string {
    const categoryTips: Record<AnalysisCategory, string> = {
      aim: `Pour améliorer ta visée, je te recommande:

1. **Échauffement quotidien** (15-20 min)
   - Aim Lab ou Kovaak's pour les réflexes
   - yprac maps pour le spray control

2. **Crosshair placement**
   - Garde toujours ta visée au niveau de la tête
   - Anticipe les positions ennemies

3. **Exercice concret**: Workshop map "Aim Botz" - 500 kills par jour
   - Focus sur les one-taps
   - Varie les distances`,

      positioning: `Pour améliorer ton positionnement:

1. **Off-angles**
   - Évite les positions prévisibles
   - Utilise des angles que les ennemis ne pre-aim pas

2. **Cover**
   - Toujours avoir un couvert à proximité
   - Ne reste jamais exposé à plusieurs angles

3. **Exercice**: Regarde des POV de pros comme s1mple ou NiKo
   - Note leurs positions sur chaque site
   - Reproduis-les en DM`,

      utility: `Pour améliorer ton usage des grenades:

1. **Smokes essentiels**
   - Apprends 3-4 smokes par map
   - Priorité aux one-ways et aux smokes d'exécution

2. **Flashes**
   - Pop-flashes > Air flashes
   - Flash pour toi-même et tes coéquipiers

3. **Exercice**: yprac utility practice maps
   - 15 min par jour sur ta map principale`,

      economy: `Pour améliorer ta gestion économique:

1. **Règles de base**
   - Ne force jamais seul
   - Garde $2000+ après un buy

2. **Team economy**
   - Communique avec ton équipe
   - Sacrifice ton buy pour un drop AWP si nécessaire

3. **Conseil**: Utilise le tableau de buy suggéré au début du round`,

      timing: `Pour améliorer ton timing:

1. **Peek timing**
   - Jiggle peek pour l'info
   - Wide peek vs AWP, close peek sinon

2. **Rotations**
   - Écoute les sons (pas, grenades)
   - Ne rotate pas trop tôt

3. **Exercice**: DM avec focus sur le timing
   - Compte jusqu'à 3 avant chaque peek
   - Varie ta vitesse`,

      decision: `Pour améliorer tes décisions:

1. **Game sense**
   - Compte les ennemis et leur équipement
   - Adapte ton aggression au contexte

2. **Clutch**
   - Isole les duels
   - Utilise le temps à ton avantage

3. **Exercice**: Revois tes rounds perdus
   - Identifie le moment clé
   - Réfléchis à l'alternative`,

      movement: `Pour améliorer ton mouvement:

1. **Counter-strafing**
   - Appuie sur la touche opposée avant de tirer
   - Pratique en DM jusqu'à ce que ce soit automatique

2. **Strafing & peek**
   - Wide peek = A ou D puis tir
   - Jiggle peek = A+D rapide pour l'info

3. **Exercice**: Workshop map "CSGOSKILLS"
   - Focus sur les peeks en mouvement
   - Pratique les strafes dans toutes les directions`,

      awareness: `Pour améliorer ta conscience de jeu:

1. **Gestion de l'info**
   - Communique les positions ennemies
   - Écoute les callouts de ton équipe

2. **Flash awareness**
   - Tourne-toi face aux flashs
   - Mémorise les timings de flash des ennemis

3. **Bombe awareness**
   - Toujours savoir où est la bombe en CT
   - En T, note le temps restant pour planter`,

      teamplay: `Pour améliorer ton jeu d'équipe:

1. **Trading**
   - Reste proche de tes coéquipiers pour les trade
   - Entre en 2ème si tu n'es pas l'entry

2. **Support**
   - Flash pour tes coéquipiers
   - Couvre leurs angles

3. **Coordination**
   - Exécute avec l'équipe, pas seul
   - Adapte ton timing aux calls`,
    };

    if (category && categoryTips[category]) {
      return categoryTips[category];
    }

    // Réponse générique basée sur le point faible
    const weakness = context.playerStats?.worstCategory;
    if (weakness && categoryTips[weakness]) {
      return `Basé sur tes stats, voici ce que je te recommande pour ${weakness}:\n\n${categoryTips[weakness]}`;
    }

    return `Salut ${context.playerName}! Pour progresser efficacement, concentre-toi sur un aspect à la fois. Qu'est-ce qui te pose le plus de problèmes en ce moment?`;
  }

  /**
   * Génère une réponse d'analyse
   */
  private generateAnalysisResponse(context: CoachContext): string {
    if (!context.playerStats) {
      return 'Je n\'ai pas assez de données pour faire une analyse. Uploade quelques démos et je pourrai te donner un feedback détaillé!';
    }

    const stats = context.playerStats;
    const trend = stats.recentTrend === 'improving' ? '📈' :
                  stats.recentTrend === 'declining' ? '📉' : '➡️';

    return `**Analyse de tes performances** ${trend}

📊 **Statistiques globales**
- Rating: ${stats.avgRating.toFixed(2)}
- K/D: ${stats.avgKD.toFixed(2)}
- ADR: ${stats.avgADR.toFixed(0)}
- Win rate: ${(stats.winRate * 100).toFixed(0)}%

💪 **Point fort**: ${stats.bestCategory}
Ton meilleur domaine, continue de capitaliser dessus.

⚠️ **À améliorer**: ${stats.worstCategory}
C'est ton axe de progression prioritaire.

📈 **Tendance**: ${stats.recentTrend === 'improving' ? 'En progression' : stats.recentTrend === 'declining' ? 'En baisse' : 'Stable'}

Tu veux que je te donne des exercices spécifiques pour ${stats.worstCategory}?`;
  }

  /**
   * Génère une réponse d'exercice
   */
  private generateExerciseResponse(category?: AnalysisCategory): string {
    const exercises: Record<AnalysisCategory | 'general', string> = {
      aim: `**Routine Aim (30 min)**

1. **Échauffement** (10 min)
   - Aim Lab: Gridshot - 3 runs
   - Focus: fluidité, pas la vitesse

2. **Spray Control** (10 min)
   - Workshop: "Recoil Master"
   - AK-47, M4A4, M4A1-S

3. **Headshot DM** (10 min)
   - Serveurs communautaires HS only
   - Focus: crosshair placement`,

      positioning: `**Routine Positioning (20 min)**

1. **VOD Review** (10 min)
   - Regarde 2 rounds de pros sur ta map
   - Note les positions CT et T

2. **Practice** (10 min)
   - Bot game sur ta map
   - Teste 3 nouvelles positions`,

      utility: `**Routine Utility (25 min)**

1. **Smokes** (10 min)
   - Workshop: yprac maps
   - 5 smokes par site

2. **Flashes** (10 min)
   - Pop-flashes pour chaque entrée
   - Self-flash entries

3. **Test en match** (5 min)
   - Note mentale des utilitaires à utiliser`,

      economy: `**Exercice Economy**

1. **Règles à mémoriser**:
   - Pistol loss: force ou full eco?
   - Quand drop AWP?
   - Quand save?

2. **Practice**: Dans tes prochains matchs, annonce ton argent à chaque round`,

      timing: `**Routine Timing (15 min)**

1. **DM Focus** (15 min)
   - Compte "1-2-3" avant chaque peek
   - Alterne wide/close peeks
   - Focus sur les pre-fires`,

      decision: `**Exercice Game Sense**

1. **Demo Review** (15 min)
   - Regarde 3 rounds perdus
   - Pause au moment clé
   - Réfléchis à l'alternative

2. **Mental Note**: En match, verbalise tes décisions`,

      movement: `**Routine Movement (20 min)**

1. **Counter-strafe drills** (10 min)
   - DM avec focus sur l'arrêt avant tir
   - Alterne les directions A/D

2. **Peek practice** (10 min)
   - Workshop "Yprac Aim"
   - Wide peeks et shoulder peeks`,

      awareness: `**Routine Awareness (15 min)**

1. **Sound training** (10 min)
   - DM avec focus sur les sons
   - Note mentale de chaque ennemi

2. **Flash dodge practice** (5 min)
   - Entraîne-toi à te retourner rapidement`,

      teamplay: `**Routine Teamplay**

1. **Trade practice** (en premade)
   - Entre toujours en 2ème
   - Focus sur le timing de trade

2. **Communication drill**
   - Appelle chaque info avec position exacte`,

      general: `**Routine Quotidienne (45 min)**

1. **Aim** (15 min)
   - Aim Lab ou DM

2. **Utility** (10 min)
   - yprac maps

3. **DM** (20 min)
   - FFA DM standard
   - Focus: aim + movement`,
    };

    return exercises[category || 'general'];
  }

  /**
   * Génère une réponse d'explication
   */
  private generateExplanationResponse(question: string, category?: AnalysisCategory): string {
    // Réponses basiques pour les questions fréquentes
    const explanations: Record<string, string> = {
      crosshair: `**Le crosshair placement**

C'est l'habitude de toujours avoir ta visée au niveau de la tête, pré-aimée sur les positions probables des ennemis.

**Pourquoi c'est important:**
- Réduit le temps de réaction
- Augmente le % de headshots
- Te donne l'avantage en duel

**Comment s'améliorer:**
- Mémorise les hauteurs de tête sur chaque map
- Imagine où sera l'ennemi avant de peek`,

      jiggle: `**Le jiggle peek**

C'est un mouvement rapide gauche-droite pour obtenir de l'info sans s'exposer.

**Technique:**
1. A+D rapide devant l'angle
2. Récupère l'info visuelle
3. Décide: peek ou pas

**Quand l'utiliser:**
- Pour check un angle AWP
- Pour baiter un tir
- Pour obtenir de l'info`,
    };

    // Cherche une réponse correspondante
    for (const [key, explanation] of Object.entries(explanations)) {
      if (question.toLowerCase().includes(key)) {
        return explanation;
      }
    }

    return `Bonne question! ${category ? `En ce qui concerne ${category}, ` : ''}je vais t'expliquer ça en détail. Peux-tu me donner plus de contexte sur ce que tu veux comprendre?`;
  }

  /**
   * Génère une réponse pour une revue de démo
   */
  private generateDemoResponse(context: CoachContext): string {
    if (context.recentAnalyses && context.recentAnalyses.length > 0) {
      const latest = context.recentAnalyses[0];
      return `**Analyse de ta dernière partie** (${latest.map})

📊 **Résultat**: ${latest.score.team}-${latest.score.opponent} (${latest.result})
⭐ **Rating**: ${latest.rating.toFixed(2)}

**Points clés:**
${latest.keyInsights.map((i) => `- ${i}`).join('\n')}

**Recommandations:**
${latest.recommendations.map((r) => `- ${r}`).join('\n')}

Tu veux que j'approfondisse un point en particulier?`;
    }

    return 'Je n\'ai pas de démo récente à analyser. Uploade une démo et je te ferai un retour détaillé!';
  }

  /**
   * Génère une réponse générale
   */
  private generateGeneralResponse(context: CoachContext): string {
    const greetings = [
      `Salut ${context.playerName}! Comment puis-je t'aider aujourd'hui?`,
      `Hey ${context.playerName}! Prêt pour une session de coaching?`,
      `Qu'est-ce qu'on travaille aujourd'hui ${context.playerName}?`,
    ];

    const topics = [
      'Améliorer ta visée',
      'Revoir une démo',
      'Exercices d\'échauffement',
      'Conseils tactiques',
      'Gestion de l\'économie',
    ];

    return `${greetings[Math.floor(Math.random() * greetings.length)]}

Je peux t'aider avec:
${topics.map((t) => `- ${t}`).join('\n')}

Qu'est-ce qui t'intéresse?`;
  }

  /**
   * Génère des suggestions de questions
   */
  private generateSuggestions(intent: CoachingIntent, context: CoachContext): string[] {
    const suggestions: string[] = [];

    // Suggestions basées sur le contexte
    if (context.playerStats?.worstCategory) {
      suggestions.push(`Comment améliorer mon ${context.playerStats.worstCategory}?`);
    }

    // Suggestions basées sur l'intention
    switch (intent.type) {
      case 'improvement':
        suggestions.push('Quels exercices me recommandes-tu?');
        suggestions.push('Montre-moi mes stats détaillées');
        break;
      case 'analysis':
        suggestions.push('Comment puis-je progresser?');
        suggestions.push('Revois ma dernière démo');
        break;
      case 'exercise':
        suggestions.push('Une routine pour un autre skill?');
        suggestions.push('Des exercices plus avancés?');
        break;
      default:
        suggestions.push('Analyse mes performances');
        suggestions.push('Donne-moi des exercices');
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Génère des actions suggérées
   */
  private generateActions(
    intent: CoachingIntent,
    context: CoachContext,
    _request: ChatRequest
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    if (intent.type === 'analysis' || intent.type === 'demo') {
      actions.push({
        type: 'view_stats',
        label: 'Voir mes stats',
        href: '/dashboard/overview',
      });
    }

    if (intent.type === 'exercise') {
      actions.push({
        type: 'start_exercise',
        label: 'Démarrer un exercice',
        href: '/dashboard/training',
      });
    }

    if (context.recentAnalyses?.length) {
      actions.push({
        type: 'view_demo',
        label: 'Voir ma dernière démo',
        href: `/dashboard/demos/${context.recentAnalyses[0].demoId}`,
      });
    }

    return actions;
  }

  /**
   * Message système initial
   */
  private getInitialSystemMessage(context: CoachContext): string {
    return `Session de coaching initiée pour ${context.playerName}. Rank: ${context.currentRank || 'Non spécifié'}. Objectif: ${context.targetRank || 'Progresser'}.`;
  }

  /**
   * Récupère une session
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Liste les sessions d'un utilisateur
   */
  getUserSessions(userId: string): ChatSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  /**
   * Termine une session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }
}

// ============================================
// TYPES INTERNES
// ============================================

type IntentType = 'improvement' | 'analysis' | 'exercise' | 'explanation' | 'comparison' | 'demo' | 'general';

interface CoachingIntent {
  type: IntentType;
  category?: AnalysisCategory;
  mode: CoachingMode;
  confidence: number;
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const coachEngine = new CoachEngine();
