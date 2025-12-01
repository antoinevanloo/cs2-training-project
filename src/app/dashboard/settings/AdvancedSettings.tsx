'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Settings,
  Key,
  Download,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Database,
  Code,
  Shield,
  Clock,
  FileJson,
  HardDrive,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedSettingsProps {
  isPremium?: boolean;
}

export function AdvancedSettings({ isPremium = false }: AdvancedSettingsProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Reset states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<'stats' | 'demos' | 'all' | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Generate API Key
  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        setShowApiKey(true);
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Copy API Key
  const handleCopyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Export data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/user/export?format=${exportFormat}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cs2-coach-data-${Date.now()}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset data
  const handleReset = async () => {
    if (confirmText !== 'SUPPRIMER' || !resetType) return;

    setIsResetting(true);
    try {
      const response = await fetch('/api/user/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: resetType }),
      });

      if (response.ok) {
        // Reload page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to reset data:', error);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
      setConfirmText('');
      setResetType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cs2-accent" />
            Accès API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPremium ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                L'accès API est réservé aux abonnés Pro. Passez à Pro pour accéder à vos données via l'API.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">
                Utilisez votre clé API pour accéder à vos données depuis des applications externes.
              </p>

              {apiKey ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        readOnly
                        className="pr-20 font-mono text-sm"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleCopyApiKey}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleGenerateApiKey}
                      disabled={isGeneratingKey}
                      className="gap-1"
                    >
                      <RefreshCw className={cn('w-4 h-4', isGeneratingKey && 'animate-spin')} />
                      Régénérer
                    </Button>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Exemple d'utilisation:</p>
                    <code className="text-xs text-cs2-accent font-mono block bg-gray-900 p-2 rounded">
                      curl -H "Authorization: Bearer {'{'}API_KEY{'}'}" \<br />
                      &nbsp;&nbsp;https://api.cs2coach.com/v1/stats
                    </code>
                  </div>
                </div>
              ) : (
                <Button onClick={handleGenerateApiKey} disabled={isGeneratingKey} className="gap-2">
                  <Key className="w-4 h-4" />
                  {isGeneratingKey ? 'Génération...' : 'Générer une clé API'}
                </Button>
              )}

              {/* Rate limits */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Limites de requêtes</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 100 requêtes / minute</li>
                  <li>• 10,000 requêtes / jour</li>
                  <li>• Endpoints: /stats, /demos, /analysis</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Export de données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Exportez toutes vos données dans un format portable. Inclut les stats, analyses, et historique.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('json')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-colors',
                  exportFormat === 'json'
                    ? 'bg-cs2-accent text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >
                <FileJson className="w-4 h-4 inline mr-1" />
                JSON
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-colors',
                  exportFormat === 'csv'
                    ? 'bg-cs2-accent text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >
                <HardDrive className="w-4 h-4 inline mr-1" />
                CSV
              </button>
            </div>

            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className={cn('w-4 h-4', isExporting && 'animate-bounce')} />
              {isExporting ? 'Export en cours...' : 'Télécharger'}
            </Button>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Données incluses</h4>
            <ul className="text-xs text-gray-400 space-y-1 grid grid-cols-2 gap-1">
              <li>• Statistiques globales</li>
              <li>• Historique des demos</li>
              <li>• Scores d'analyse</li>
              <li>• Recommandations reçues</li>
              <li>• Objectifs et progression</li>
              <li>• Préférences</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Custom Metrics Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Pondération personnalisée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPremium ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                La personnalisation des poids d'analyse est réservée aux abonnés Pro.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">
                Ajustez l'importance de chaque catégorie dans le calcul de votre score global.
              </p>

              <div className="space-y-3">
                {[
                  { id: 'aim', label: 'Aim', default: 20 },
                  { id: 'positioning', label: 'Positionnement', default: 15 },
                  { id: 'utility', label: 'Utilitaires', default: 12 },
                  { id: 'economy', label: 'Économie', default: 10 },
                  { id: 'timing', label: 'Timing', default: 12 },
                  { id: 'decision', label: 'Décision', default: 10 },
                  { id: 'movement', label: 'Mouvement', default: 8 },
                  { id: 'awareness', label: 'Conscience', default: 8 },
                  { id: 'teamplay', label: 'Jeu d\'équipe', default: 5 },
                ].map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-32">{category.label}</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      defaultValue={category.default}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-white w-12 text-right">{category.default}%</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <span className="text-sm text-gray-400">Total: 100%</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Réinitialiser
                  </Button>
                  <Button size="sm">Sauvegarder</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session & Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Session & Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-1">Sessions actives</h4>
              <p className="text-2xl font-bold text-cs2-accent">1</p>
              <p className="text-xs text-gray-500 mt-1">Cet appareil</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-1">Cache local</h4>
              <p className="text-2xl font-bold text-blue-400">2.4 MB</p>
              <p className="text-xs text-gray-500 mt-1">Données mises en cache</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="gap-1">
              <RefreshCw className="w-4 h-4" />
              Vider le cache
            </Button>
            <Button variant="secondary" size="sm" className="gap-1">
              <Shield className="w-4 h-4" />
              Déconnecter partout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Zone de danger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Ces actions sont irréversibles. Procédez avec précaution.
          </p>

          <div className="space-y-3">
            {/* Reset Stats */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-white">Réinitialiser les statistiques</h4>
                <p className="text-xs text-gray-500">Remet à zéro toutes vos moyennes et progressions</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResetType('stats');
                  setShowResetConfirm(true);
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Réinitialiser
              </Button>
            </div>

            {/* Delete Demos */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-white">Supprimer toutes les démos</h4>
                <p className="text-xs text-gray-500">Supprime toutes vos démos et analyses associées</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResetType('demos');
                  setShowResetConfirm(true);
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Supprimer
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-red-400">Supprimer le compte</h4>
                <p className="text-xs text-gray-500">Supprime définitivement votre compte et toutes les données</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResetType('all');
                  setShowResetConfirm(true);
                }}
                className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {resetType === 'all'
                  ? 'Supprimer le compte ?'
                  : resetType === 'demos'
                  ? 'Supprimer toutes les démos ?'
                  : 'Réinitialiser les statistiques ?'}
              </h3>
              <p className="text-sm text-gray-400">
                {resetType === 'all'
                  ? 'Cette action supprimera définitivement votre compte et toutes vos données. Cette action est irréversible.'
                  : resetType === 'demos'
                  ? 'Toutes vos démos et analyses seront supprimées. Cette action est irréversible.'
                  : 'Toutes vos statistiques et progressions seront réinitialisées. Cette action est irréversible.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Tapez <span className="text-red-400 font-mono">SUPPRIMER</span> pour confirmer
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="text-center"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowResetConfirm(false);
                    setConfirmText('');
                    setResetType(null);
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={confirmText !== 'SUPPRIMER' || isResetting}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  {isResetting ? 'Suppression...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
