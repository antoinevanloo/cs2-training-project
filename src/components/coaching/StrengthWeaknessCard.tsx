'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface StrengthWeaknessCardProps {
  strengths: string[];
  weaknesses: string[];
  compact?: boolean;
  showTitle?: boolean;
  maxItems?: number;
  onViewMore?: () => void;
}

export function StrengthWeaknessCard({
  strengths,
  weaknesses,
  compact = false,
  showTitle = true,
  maxItems = 3,
  onViewMore,
}: StrengthWeaknessCardProps) {
  const displayedStrengths = strengths.slice(0, maxItems);
  const displayedWeaknesses = weaknesses.slice(0, maxItems);
  const hasMore = strengths.length > maxItems || weaknesses.length > maxItems;

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {/* Forces - Compact */}
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">Forces</span>
          </div>
          <ul className="space-y-1">
            {displayedStrengths.length > 0 ? (
              displayedStrengths.map((strength, idx) => (
                <li key={idx} className="text-xs text-gray-300 truncate">
                  {strength}
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-500 italic">Aucune identifiée</li>
            )}
          </ul>
          {strengths.length > maxItems && (
            <div className="text-xs text-green-400 mt-1">
              +{strengths.length - maxItems} autres
            </div>
          )}
        </div>

        {/* Faiblesses - Compact */}
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">À améliorer</span>
          </div>
          <ul className="space-y-1">
            {displayedWeaknesses.length > 0 ? (
              displayedWeaknesses.map((weakness, idx) => (
                <li key={idx} className="text-xs text-gray-300 truncate">
                  {weakness}
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-500 italic">Aucune identifiée</li>
            )}
          </ul>
          {weaknesses.length > maxItems && (
            <div className="text-xs text-red-400 mt-1">
              +{weaknesses.length - maxItems} autres
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Forces */}
      <Card className="bg-green-500/5 border-green-500/30">
        {showTitle && (
          <CardHeader className="pb-2">
            <CardTitle className="text-green-400 flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5" />
              Points forts
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? 'pt-0' : ''}>
          <ul className="space-y-2">
            {displayedStrengths.length > 0 ? (
              displayedStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span className="text-gray-300 text-sm">{strength}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm italic">
                Analysez plus de matchs pour identifier vos points forts
              </li>
            )}
          </ul>
          {strengths.length > maxItems && (
            <div className="text-sm text-green-400/70 mt-2 pt-2 border-t border-green-500/20">
              +{strengths.length - maxItems} autres points forts
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faiblesses */}
      <Card className="bg-red-500/5 border-red-500/30">
        {showTitle && (
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 flex items-center gap-2 text-base">
              <TrendingDown className="w-5 h-5" />
              À améliorer
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? 'pt-0' : ''}>
          <ul className="space-y-2">
            {displayedWeaknesses.length > 0 ? (
              displayedWeaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span className="text-gray-300 text-sm">{weakness}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm italic">
                Aucun point faible majeur détecté
              </li>
            )}
          </ul>
          {weaknesses.length > maxItems && (
            <div className="text-sm text-red-400/70 mt-2 pt-2 border-t border-red-500/20">
              +{weaknesses.length - maxItems} autres points à améliorer
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton Voir Plus */}
      {hasMore && onViewMore && (
        <button
          onClick={onViewMore}
          className="md:col-span-2 flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Voir tous les détails
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Version inline pour affichage dans une liste
export function StrengthWeaknessBadges({
  strengths,
  weaknesses,
  max = 2,
}: {
  strengths: string[];
  weaknesses: string[];
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {strengths.slice(0, max).map((s, i) => (
        <span
          key={`s-${i}`}
          className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded"
        >
          +{s}
        </span>
      ))}
      {weaknesses.slice(0, max).map((w, i) => (
        <span
          key={`w-${i}`}
          className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded"
        >
          -{w}
        </span>
      ))}
    </div>
  );
}
