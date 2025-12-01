'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Target,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Zap,
  Brain,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisCategory } from '@/lib/preferences/types';
import { getCategoryStyle } from '@/lib/design/tokens';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: AnalysisCategory;
  suggestions?: string[];
  isTyping?: boolean;
}

interface UserStats {
  avgRating: number | null;
  avgAdr: number | null;
  avgKast: number | null;
  avgHsPercent: number | null;
  weakestCategory?: AnalysisCategory;
  strongestCategory?: AnalysisCategory;
  recentTrend?: 'up' | 'down' | 'stable';
}

interface CoachChatClientProps {
  userStats: UserStats | null;
  recentDemosCount: number;
  userName: string;
  /** Catégories d'analyse activées */
  enabledCategories: AnalysisCategory[];
}

// Suggested prompts by category
const SUGGESTED_PROMPTS = {
  general: [
    "Comment puis-je m'améliorer rapidement ?",
    "Quels sont mes points forts et faibles ?",
    "Analyse mes dernières performances",
  ],
  aim: [
    "Comment améliorer mon aim ?",
    "Des conseils pour le spray control ?",
    "Quel sensibilité recommandes-tu ?",
  ],
  positioning: [
    "Comment mieux me positionner ?",
    "Où dois-je jouer sur Mirage ?",
    "Conseils pour les angles ?",
  ],
  utility: [
    "Quelles grenades apprendre en priorité ?",
    "Comment utiliser mes smokes efficacement ?",
    "Conseils pour les flashes pop ?",
  ],
  economy: [
    "Quand dois-je forcer ?",
    "Comment gérer mon économie ?",
    "Explique-moi le système d'économie CS2",
  ],
  gamesense: [
    "Comment améliorer mon game sense ?",
    "Comment lire le jeu adverse ?",
    "Conseils pour les clutchs ?",
  ],
};

// Quick action buttons
const QUICK_ACTIONS = [
  { id: 'improve', label: "M'améliorer", icon: TrendingUp, color: 'text-green-400' },
  { id: 'analyze', label: 'Analyser', icon: Target, color: 'text-blue-400' },
  { id: 'tips', label: 'Conseils', icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'help', label: 'Aide', icon: HelpCircle, color: 'text-purple-400' },
];

// Simulated AI responses based on context
function generateAIResponse(
  message: string,
  userStats: UserStats | null,
  _recentDemosCount: number
): { content: string; category?: AnalysisCategory; suggestions?: string[] } {
  const lowerMessage = message.toLowerCase();

  // Check for specific topics
  if (lowerMessage.includes('aim') || lowerMessage.includes('visée')) {
    return {
      content: `## Conseils pour l'Aim

Basé sur ton profil${userStats?.avgHsPercent ? ` (HS%: ${userStats.avgHsPercent.toFixed(1)}%)` : ''}, voici mes recommandations:

### 1. Crosshair Placement
- Garde ton viseur à hauteur de tête en permanence
- Anticipe les angles où les ennemis peuvent apparaître
- Utilise les éléments du décor comme repères

### 2. Routine d'entraînement
- **Aim Lab/Kovaaks** : 15-20 min avant de jouer
- **Deathmatch** : Focus sur les headshots uniquement
- **Workshop maps** : Yprac, aim_botz

### 3. Settings recommandés
- Sensibilité basse (eDPI 400-800)
- Mouse acceleration: OFF
- Raw input: ON

Tu veux que je détaille un point en particulier ?`,
      category: 'aim',
      suggestions: [
        'Parle-moi du spray control',
        'Quelle routine quotidienne ?',
        'Settings pro players ?',
      ],
    };
  }

  if (lowerMessage.includes('position') || lowerMessage.includes('angle')) {
    return {
      content: `## Améliorer ton Positionnement

Le positionnement est crucial pour survivre et avoir de l'impact. Voici les bases:

### Règles d'or
1. **Ne jamais être prévisible** - Change de position après chaque kill
2. **Off-angles** - Joue des angles inattendus
3. **Trade positions** - Reste visible de tes coéquipiers

### Erreurs communes
- ❌ Rester exposé à plusieurs angles
- ❌ Repush après un kill
- ❌ Jouer trop avancé sans info

### Pour progresser
1. Regarde des replays de pros sur ta map favorite
2. Apprends 2-3 positions par site
3. Adapte-toi au round (post-plant vs retake)

Quelle map veux-tu travailler ?`,
      category: 'positioning',
      suggestions: [
        'Positions sur Mirage',
        'Comment jouer retake ?',
        'Angles pour AWP',
      ],
    };
  }

  if (lowerMessage.includes('économie') || lowerMessage.includes('economy') || lowerMessage.includes('argent')) {
    return {
      content: `## Guide Économie CS2

### Comprendre les basics
- **Kill bonus**: $300 (rifle), $600 (SMG), $100 (AWP)
- **Round win**: $3250 (T bomb), $3500 (CT defuse)
- **Loss bonus**: $1400 → $3400 (incrémental)

### Quand forcer ?
✅ Force si:
- Dernier round de half
- Score serré (12-12, etc.)
- Équipe adverse en éco

❌ Ne force pas si:
- Loss bonus pas maxé
- Round après pistol perdu
- Teammates en full save

### Tips pro
1. **Communique** ton argent à l'équipe
2. **Drop** pour les fraggers
3. **Sauve** ton arme si round perdu (>$3000)

Tu veux simuler un scénario économique ?`,
      category: 'economy',
      suggestions: [
        'Quand acheter AWP ?',
        'Full save vs force ?',
        'Gérer le loss bonus',
      ],
    };
  }

  if (lowerMessage.includes('améliorer') || lowerMessage.includes('progresser') || lowerMessage.includes('improve')) {
    const weakPoint = userStats?.weakestCategory;
    const strongPoint = userStats?.strongestCategory;

    return {
      content: `## Plan de progression personnalisé

${userStats ? `📊 **Tes stats actuelles:**
- Rating: ${userStats.avgRating?.toFixed(2) || 'N/A'}
- ADR: ${userStats.avgAdr?.toFixed(1) || 'N/A'}
- HS%: ${userStats.avgHsPercent?.toFixed(1) || 'N/A'}%
${weakPoint ? `- Point faible identifié: **${getCategoryStyle(weakPoint).label}**` : ''}
${strongPoint ? `- Point fort: **${getCategoryStyle(strongPoint).label}**` : ''}

` : ''}### Priorités recommandées

1. **Court terme** (cette semaine)
   ${weakPoint ? `- Focus sur: ${getCategoryStyle(weakPoint).label}` : '- Analyse tes replays'}
   - 20 min d'aim training/jour
   - Joue 2-3 maps maximum

2. **Moyen terme** (ce mois)
   - Maîtrise les utilitaires de base
   - Apprends les callouts
   - Travaille la communication

3. **Long terme**
   - Développe ton game sense
   - Apprends à lire les rounds
   - Perfectionne tes maps préférées

Par où veux-tu commencer ?`,
      suggestions: [
        'Focus sur mon point faible',
        'Routine quotidienne',
        'Meilleurs exercices',
      ],
    };
  }

  if (lowerMessage.includes('grenade') || lowerMessage.includes('smoke') || lowerMessage.includes('flash') || lowerMessage.includes('utility')) {
    return {
      content: `## Maîtriser les Utilitaires

### Priorités d'apprentissage
1. **Smokes essentielles** (3-5 par map)
2. **Pop flashes** (self-flash, support)
3. **Molotovs** défensifs

### Par map (commence par)
- **Mirage**: Window, Jungle, CT spawn
- **Inferno**: Banana control, Apps
- **Dust2**: Mid doors, Long cross

### Conseils
- Apprends par besoin, pas par quantité
- Practice en offline avec sv_cheats 1
- Regarde les setups des pros

### Workshop maps recommandées
- Yprac maps (practice mode)
- crashz Crosshair Generator
- Smoke practice maps

Quelle map veux-tu maîtriser ?`,
      category: 'utility',
      suggestions: [
        'Smokes Mirage A',
        'Pop flashes efficaces',
        'Molotov défensifs',
      ],
    };
  }

  // Default response
  return {
    content: `## Comment puis-je t'aider ?

Je suis ton coach CS2 personnel. Je peux t'aider avec:

- 🎯 **Aim** - Technique, settings, training
- 📍 **Positioning** - Angles, rotations, map control
- 💣 **Utility** - Grenades, smokes, flashes
- 💰 **Economy** - Gestion argent, buy rounds
- 🧠 **Game sense** - Lecture du jeu, décisions

${userStats ? `
📊 **Ton profil:**
- ${_recentDemosCount} démos analysées
- Rating moyen: ${userStats.avgRating?.toFixed(2) || 'N/A'}
` : ''}

Pose-moi une question ou choisis un sujet ci-dessous !`,
    suggestions: [
      "Comment m'améliorer ?",
      'Analyse mes stats',
      'Conseils pour ranked',
    ],
  };
}

export function CoachChatClient({ userStats, recentDemosCount, userName, enabledCategories }: CoachChatClientProps) {
  // Filtrer les prompts par catégories activées
  const getFilteredPrompts = () => {
    const allPrompts = [...SUGGESTED_PROMPTS.general];

    // Ajouter les prompts des catégories activées
    if (enabledCategories.includes('aim')) {
      allPrompts.push(...SUGGESTED_PROMPTS.aim);
    }
    if (enabledCategories.includes('positioning')) {
      allPrompts.push(...SUGGESTED_PROMPTS.positioning);
    }
    if (enabledCategories.includes('utility')) {
      allPrompts.push(...SUGGESTED_PROMPTS.utility);
    }
    if (enabledCategories.includes('economy')) {
      allPrompts.push(...SUGGESTED_PROMPTS.economy);
    }

    return allPrompts;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `# Salut ${userName} !

Je suis ton **Coach IA CS2**. Je suis là pour t'aider à progresser basé sur l'analyse de tes performances.

${userStats ? `
📊 **Ton profil actuel:**
- Rating: **${userStats.avgRating?.toFixed(2) || 'N/A'}**
- ADR: **${userStats.avgAdr?.toFixed(1) || 'N/A'}**
- HS%: **${userStats.avgHsPercent?.toFixed(1) || 'N/A'}%**
- Démos analysées: **${recentDemosCount}**
` : 'Upload quelques démos pour que je puisse analyser ton jeu !'}

Qu'est-ce que tu aimerais travailler aujourd'hui ?`,
      timestamp: new Date(),
      suggestions: [
        "Comment m'améliorer ?",
        'Analyse mes points faibles',
        'Conseils pour le ranked',
      ],
    };
    setMessages([welcomeMessage]);
  }, [userName, userStats, recentDemosCount]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Generate AI response
    const response = generateAIResponse(messageText, userStats, recentDemosCount);

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      category: response.category,
      suggestions: response.suggestions,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([]);
    setShowSuggestions(true);
    // Re-trigger welcome message
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: 'welcome-new',
        role: 'assistant',
        content: `Nouvelle conversation ! Comment puis-je t'aider ?`,
        timestamp: new Date(),
        suggestions: [
          "Comment m'améliorer ?",
          'Analyse mes points faibles',
          'Conseils pour le ranked',
        ],
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  const handleQuickAction = (actionId: string) => {
    const prompts: Record<string, string> = {
      improve: "Comment puis-je m'améliorer rapidement ?",
      analyze: 'Analyse mes dernières performances et identifie mes faiblesses',
      tips: 'Donne-moi 3 conseils pratiques pour progresser',
      help: "Qu'est-ce que tu peux m'aider à faire ?",
    };
    handleSend(prompts[actionId]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cs2-accent/20 to-purple-500/20 border border-cs2-accent/30">
            <Brain className="w-6 h-6 text-cs2-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Coach IA</h1>
            <p className="text-sm text-gray-400">Ton assistant coaching personnalisé</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Nouvelle conversation
        </Button>
      </div>

      {/* Quick Actions */}
      {showSuggestions && messages.length <= 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-all group"
              >
                <Icon className={cn('w-5 h-5 mb-2', action.color)} />
                <span className="text-sm text-white font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cs2-accent to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-xl p-4',
                  message.role === 'user'
                    ? 'bg-cs2-accent text-white'
                    : 'bg-gray-800 border border-gray-700'
                )}
              >
                {/* Category badge */}
                {message.category && (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                    style={{
                      backgroundColor: `${getCategoryStyle(message.category).color}20`,
                      color: getCategoryStyle(message.category).color,
                    }}
                  >
                    {getCategoryStyle(message.category).label}
                  </span>
                )}

                {/* Message content with markdown-like formatting */}
                <div
                  className={cn(
                    'prose prose-sm max-w-none',
                    message.role === 'assistant' ? 'prose-invert' : ''
                  )}
                >
                  {message.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={i} className="text-xl font-bold text-white mb-2">
                          {line.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-lg font-semibold text-white mt-4 mb-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={i} className="text-base font-medium text-white mt-3 mb-1">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <p key={i} className="text-gray-300 ml-4">
                          • {line.replace('- ', '')}
                        </p>
                      );
                    }
                    if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                      return (
                        <p key={i} className="text-gray-300 ml-4">
                          {line}
                        </p>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return (
                      <p key={i} className="text-gray-300">
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Copy button for assistant messages */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copier
                      </>
                    )}
                  </button>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(suggestion)}
                        className="px-3 py-1.5 text-xs rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cs2-accent to-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Réflexion en cours...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question au coach..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border border-gray-700 focus:border-cs2-accent focus:ring-1 focus:ring-cs2-accent text-white placeholder-gray-500 resize-none"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 h-auto"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Suggested prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Suggestions:
            </span>
            {SUGGESTED_PROMPTS.general.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tips sidebar for desktop */}
      <div className="hidden lg:block fixed right-4 top-24 w-64">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cs2-accent" />
            Topics populaires
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Aim training', query: 'Meilleure routine aim training' },
              { label: 'Crosshair placement', query: 'Comment améliorer mon crosshair placement' },
              { label: 'Economy', query: 'Guide économie CS2' },
              { label: 'Utility', query: 'Grenades essentielles à apprendre' },
            ].map((topic, i) => (
              <button
                key={i}
                onClick={() => handleSend(topic.query)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
