'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  FileText,
  Image,
  Table,
  Share2,
  Download,
  Copy,
  Check,
  Loader2,
  FileJson,
  Twitter,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExportFormat = 'pdf' | 'image' | 'csv' | 'json' | 'clipboard';
type ExportScope = 'demo' | 'period' | 'all';

interface ExportOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: typeof FileText;
  color: string;
  premium?: boolean;
  available: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'pdf',
    name: 'Rapport PDF',
    description: 'Rapport complet avec tous les graphiques et analyses',
    icon: FileText,
    color: 'text-red-400',
    premium: true,
    available: true,
  },
  {
    id: 'image',
    name: 'Carte Sociale',
    description: 'Image 1200x630 optimisée pour partage social',
    icon: Image,
    color: 'text-blue-400',
    available: true,
  },
  {
    id: 'csv',
    name: 'Export CSV',
    description: 'Données brutes en format tableur',
    icon: Table,
    color: 'text-green-400',
    premium: true,
    available: true,
  },
  {
    id: 'json',
    name: 'Export JSON',
    description: 'Données structurées pour analyse externe',
    icon: FileJson,
    color: 'text-yellow-400',
    premium: true,
    available: true,
  },
  {
    id: 'clipboard',
    name: 'Copier Stats',
    description: 'Copie formatée pour Discord/Twitter',
    icon: Copy,
    color: 'text-purple-400',
    available: true,
  },
];

const SHARE_PLATFORMS = [
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500' },
  { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'bg-indigo-500' },
];

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [scope, setScope] = useState<ExportScope>('demo');
  const [selectedDemoId, setSelectedDemoId] = useState<string>('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleExport = async () => {
    if (!selectedFormat) return;

    setIsExporting(true);
    setExportUrl(null);

    try {
      const params = new URLSearchParams({
        format: selectedFormat,
        scope,
        ...(scope === 'demo' && selectedDemoId ? { demoId: selectedDemoId } : {}),
        ...(scope === 'period' ? { period } : {}),
      });

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (selectedFormat === 'clipboard') {
        const data = await response.json();
        await navigator.clipboard.writeText(data.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else if (selectedFormat === 'pdf' || selectedFormat === 'csv' || selectedFormat === 'json') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cs2-coach-export-${Date.now()}.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (selectedFormat === 'image') {
        const data = await response.json();
        setExportUrl(data.imageUrl);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = (platform: string) => {
    const shareText = "Check out my CS2 Coach stats! 🎮";
    const shareUrl = exportUrl || window.location.origin;

    if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    } else if (platform === 'discord') {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Export Hub</h1>
        <p className="text-gray-400 mt-1">Exporte et partage tes statistiques</p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedFormat === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-200',
                'hover:scale-[1.02] hover:border-gray-600',
                isSelected && 'border-cs2-accent ring-1 ring-cs2-accent/50',
                !option.available && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => option.available && setSelectedFormat(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg bg-gray-800',
                    option.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{option.name}</h3>
                      {option.premium && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-cs2-accent" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration */}
      {selectedFormat && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-white">Configuration</CardTitle>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scope selector */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Portée des données</label>
              <Select
                value={scope}
                onChange={(e) => setScope(e.target.value as ExportScope)}
              >
                <option value="demo">Une démo spécifique</option>
                <option value="period">Une période</option>
                <option value="all">Toutes les données</option>
              </Select>
            </div>

            {/* Conditional selectors */}
            {scope === 'demo' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sélectionner la démo</label>
                <Select
                  value={selectedDemoId}
                  onChange={(e) => setSelectedDemoId(e.target.value)}
                >
                  <option value="">Dernière démo</option>
                  {/* Would be populated with demos */}
                </Select>
              </div>
            )}

            {scope === 'period' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Période</label>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                >
                  <option value="7d">7 derniers jours</option>
                  <option value="30d">30 derniers jours</option>
                  <option value="90d">90 derniers jours</option>
                  <option value="all">Tout l'historique</option>
                </Select>
              </div>
            )}
          </div>

          {/* Export button */}
          <div className="mt-6">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full md:w-auto gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Export en cours...
                </>
              ) : copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Preview / Result */}
      {exportUrl && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-white">Aperçu</CardTitle>
          </CardHeader>

          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <img
              src={exportUrl}
              alt="Export preview"
              className="w-full max-w-lg mx-auto rounded"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => window.open(exportUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(exportUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>
          </div>
        </Card>
      )}

      {/* Share Section */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Partager
          </CardTitle>
        </CardHeader>

        <p className="text-gray-400 text-sm mb-4">
          Partage tes stats directement sur les réseaux sociaux
        </p>

        <div className="flex flex-wrap gap-3">
          {SHARE_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <Button
                key={platform.id}
                variant="secondary"
                onClick={() => handleShare(platform.id)}
                className={cn('gap-2', platform.color, 'hover:opacity-80')}
              >
                <Icon className="w-4 h-4" />
                {platform.name}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Quick Copy Templates */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-white">Templates rapides</CardTitle>
        </CardHeader>

        <div className="space-y-3">
          {[
            {
              name: 'Stats Discord',
              template: '```\n🎮 CS2 Stats\nRating: 1.25 | ADR: 85.4 | HS%: 52%\nMaps: 15 | Win Rate: 60%\n```',
            },
            {
              name: 'Tweet',
              template: '🎮 Ma progression CS2 cette semaine:\n📈 Rating +0.15\n🎯 HS% 52% (+3%)\n🏆 60% winrate\n\n#CS2 #Gaming',
            },
            {
              name: 'Stats complets',
              template: 'CS2 Coach Report\n================\nRating: 1.25\nADR: 85.4\nKAST: 72%\nHS%: 52%\n\nTop catégorie: Aim (78/100)\nÀ améliorer: Economy (45/100)',
            },
          ].map((template, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
            >
              <div>
                <h4 className="text-white font-medium text-sm">{template.name}</h4>
                <p className="text-gray-500 text-xs truncate max-w-xs">
                  {template.template.slice(0, 50)}...
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(template.template);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
