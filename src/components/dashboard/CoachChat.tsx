'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  ChatMessage,
  ChatResponse,
  CoachingMode,
  SuggestedAction,
} from '@/lib/coaching/chat';
import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// STYLES
// ============================================

const MODE_STYLES: Record<CoachingMode, { label: string; icon: string; color: string }> = {
  general: { label: 'General', icon: 'G', color: 'bg-gray-500' },
  demo_review: { label: 'Demo Review', icon: 'D', color: 'bg-blue-500' },
  skill_focus: { label: 'Skill Focus', icon: 'S', color: 'bg-purple-500' },
  warmup: { label: 'Warmup', icon: 'W', color: 'bg-orange-500' },
  mental: { label: 'Mental', icon: 'M', color: 'bg-green-500' },
  tactical: { label: 'Tactical', icon: 'T', color: 'bg-red-500' },
};

const CATEGORY_ICONS: Record<AnalysisCategory, string> = {
  aim: 'A',
  positioning: 'P',
  utility: 'U',
  economy: '$',
  timing: 'T',
  decision: 'D',
  movement: 'M',
  awareness: 'W',
  teamplay: 'E',
};

// ============================================
// MESSAGE COMPONENT
// ============================================

interface ChatMessageProps {
  message: ChatMessage;
  isLast?: boolean;
}

function ChatMessageBubble({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null; // Don't show system messages

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLast ? 'animate-fade-in' : ''}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-cs2-accent text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {/* Message content with markdown-like formatting */}
        <div className="prose prose-invert prose-sm max-w-none">
          {message.content.split('\n').map((line, i) => {
            // Bold headers
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <h4 key={i} className="font-bold text-white mt-2 mb-1">
                  {line.slice(2, -2)}
                </h4>
              );
            }
            // List items
            if (line.startsWith('- ') || line.startsWith('• ')) {
              return (
                <div key={i} className="flex items-start gap-2 ml-2">
                  <span className="text-cs2-accent mt-1">-</span>
                  <span>{line.slice(2)}</span>
                </div>
              );
            }
            // Numbered items
            if (/^\d+\.\s/.test(line)) {
              const [num, ...rest] = line.split('. ');
              return (
                <div key={i} className="flex items-start gap-2 ml-2">
                  <span className="text-cs2-accent font-medium">{num}.</span>
                  <span>{rest.join('. ')}</span>
                </div>
              );
            }
            // Empty lines
            if (!line.trim()) {
              return <div key={i} className="h-2" />;
            }
            // Regular text
            return <p key={i} className="my-1">{line}</p>;
          })}
        </div>

        {/* Metadata */}
        {message.metadata && (
          <div className="mt-2 pt-2 border-t border-gray-700/50 flex flex-wrap gap-2">
            {message.metadata.category && (
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                {message.metadata.category}
              </span>
            )}
            {message.metadata.exercises?.map((ex, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-xs">
                {ex}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${isUser ? 'text-white/60' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUGGESTION CHIPS
// ============================================

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:border-cs2-accent hover:text-white transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

// ============================================
// ACTION BUTTONS
// ============================================

interface ActionButtonsProps {
  actions: SuggestedAction[];
}

function ActionButtons({ actions }: ActionButtonsProps) {
  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, i) => (
        <a
          key={i}
          href={action.href || '#'}
          className="px-4 py-2 rounded-lg bg-cs2-accent/20 border border-cs2-accent/30 text-sm text-cs2-accent hover:bg-cs2-accent/30 transition-colors flex items-center gap-2"
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}

// ============================================
// MODE SELECTOR
// ============================================

interface ModeSelectorProps {
  mode: CoachingMode;
  onModeChange: (mode: CoachingMode) => void;
}

function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modes: CoachingMode[] = ['general', 'demo_review', 'skill_focus', 'warmup', 'mental', 'tactical'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:border-gray-600 transition-colors"
      >
        <span className={`w-4 h-4 rounded ${MODE_STYLES[mode].color} flex items-center justify-center text-xs text-white font-bold`}>
          {MODE_STYLES[mode].icon}
        </span>
        <span className="text-gray-300">{MODE_STYLES[mode].label}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 p-2 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-10 min-w-[180px]">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => {
                onModeChange(m);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                mode === m ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <span className={`w-4 h-4 rounded ${MODE_STYLES[m].color} flex items-center justify-center text-xs text-white font-bold`}>
                {MODE_STYLES[m].icon}
              </span>
              {MODE_STYLES[m].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface CoachChatProps {
  /** User ID for context */
  userId: string;
  /** Player name */
  playerName: string;
  /** Initial mode */
  initialMode?: CoachingMode;
  /** Demo ID for demo review mode */
  demoId?: string;
  /** Category focus for skill_focus mode */
  focusCategory?: AnalysisCategory;
  /** Show in compact mode */
  compact?: boolean;
  /** Additional class name */
  className?: string;
}

export function CoachChat({
  userId,
  playerName,
  initialMode = 'general',
  demoId,
  focusCategory,
  compact = false,
  className = '',
}: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<CoachingMode>(initialMode);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [actions, setActions] = useState<SuggestedAction[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);
    setActions([]);

    try {
      // Call API
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          sessionId,
          mode,
          demoId,
          focusCategory,
          context: {
            userId,
            playerName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: ChatResponse = await response.json();

      // Update state
      setMessages((prev) => [...prev, data.message]);
      setSessionId(data.sessionId);
      setSuggestions(data.suggestions || []);
      setActions(data.suggestedActions || []);
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Réessaie dans quelques instants.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle suggestion click
  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: `Salut ${playerName}! Je suis ton coach CS2 personnel. Comment puis-je t'aider aujourd'hui?

Je peux:
- Analyser tes performances
- Te donner des exercices ciblés
- Revoir tes démos
- T'aider avec des conseils tactiques

Qu'est-ce qui t'intéresse?`,
          timestamp: new Date(),
        },
      ]);
      setSuggestions([
        'Analyse mes performances',
        'Donne-moi des exercices',
        'Comment améliorer ma visée?',
      ]);
    }
  }, [playerName, messages.length]);

  return (
    <div className={`flex flex-col ${compact ? 'h-96' : 'h-[600px]'} rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cs2-accent to-cs2-accent-light flex items-center justify-center">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">CS2 Coach</h3>
            <p className="text-xs text-gray-500">
              {isLoading ? 'En train de réfléchir...' : 'En ligne'}
            </p>
          </div>
        </div>
        <ModeSelector mode={mode} onModeChange={setMode} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && !isLoading && (
          <ActionButtons actions={actions} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2">
          <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pose ta question..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cs2-accent transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 rounded-xl bg-cs2-accent text-white font-medium hover:bg-cs2-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// MINI CHAT WIDGET
// ============================================

interface MiniChatWidgetProps {
  userId: string;
  playerName: string;
}

export function MiniChatWidget({ userId, playerName }: MiniChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all z-50 ${
          isOpen
            ? 'bg-gray-700 rotate-90'
            : 'bg-gradient-to-br from-cs2-accent to-cs2-accent-light hover:scale-110'
        }`}
      >
        {isOpen ? (
          <span className="text-2xl text-white">-</span>
        ) : (
          <span className="text-2xl text-white">C</span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 z-50 shadow-2xl animate-slide-up">
          <CoachChat userId={userId} playerName={playerName} compact />
        </div>
      )}
    </>
  );
}
