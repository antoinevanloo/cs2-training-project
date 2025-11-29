'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const maps = [
  { value: 'de_dust2', label: 'Dust II' },
  { value: 'de_mirage', label: 'Mirage' },
  { value: 'de_inferno', label: 'Inferno' },
  { value: 'de_anubis', label: 'Anubis' },
  { value: 'de_ancient', label: 'Ancient' },
  { value: 'de_nuke', label: 'Nuke' },
  { value: 'de_vertigo', label: 'Vertigo' },
];

const roles = [
  { value: 'entry', label: 'Entry Fragger' },
  { value: 'support', label: 'Support' },
  { value: 'awp', label: 'AWPer' },
  { value: 'lurk', label: 'Lurker' },
  { value: 'igl', label: 'IGL' },
];

interface UserSettings {
  username: string;
  steamId: string | null;
  preferredRole: string | null;
  preferredMaps: string[];
  storageUsedMb: number;
  maxStorageMb: number;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [username, setUsername] = useState('');
  const [steamId, setSteamId] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [preferredMaps, setPreferredMaps] = useState<string[]>([]);
  const [storageUsedMb, setStorageUsedMb] = useState(0);
  const [maxStorageMb, setMaxStorageMb] = useState(500);

  // Charger les données utilisateur
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data: UserSettings = await response.json();
          setUsername(data.username || '');
          setSteamId(data.steamId || '');
          setPreferredRole(data.preferredRole || '');
          setPreferredMaps(data.preferredMaps || []);
          setStorageUsedMb(data.storageUsedMb || 0);
          setMaxStorageMb(data.maxStorageMb || 500);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleMapToggle = (mapValue: string) => {
    setPreferredMaps((prev) =>
      prev.includes(mapValue)
        ? prev.filter((m) => m !== mapValue)
        : [...prev, mapValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          steamId: steamId || null,
          preferredRole: preferredRole || null,
          preferredMaps,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setMessage({ type: 'success', text: 'Paramètres sauvegardés' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const storagePercentage = maxStorageMb > 0 ? (storageUsedMb / maxStorageMb) * 100 : 0;

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cs2-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1">Gérez vos préférences</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              placeholder="Votre nom"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div>
              <Input
                label="Steam ID"
                placeholder="76561198000000000"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
              />
              <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300 font-medium mb-1">
                  Comment trouver votre Steam ID ?
                </p>
                <ol className="text-xs text-blue-200/80 space-y-1 list-decimal list-inside">
                  <li>Ouvrez Steam et allez sur votre profil</li>
                  <li>Faites clic droit → &quot;Copier l&apos;URL de la page&quot;</li>
                  <li>
                    Allez sur{' '}
                    <a
                      href="https://steamid.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-300"
                    >
                      steamid.io
                    </a>{' '}
                    et collez l&apos;URL
                  </li>
                  <li>Copiez le &quot;steamID64&quot; (commence par 7656119...)</li>
                </ol>
              </div>
              {!steamId && (
                <p className="mt-2 text-xs text-amber-400">
                  Le Steam ID est requis pour analyser vos demos. Configurez-le pour pouvoir uploader.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Préférences de jeu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Rôle principal"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              options={[{ value: '', label: 'Sélectionner...' }, ...roles]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maps préférées
              </label>
              <div className="grid grid-cols-2 gap-2">
                {maps.map((map) => (
                  <label
                    key={map.value}
                    className="flex items-center gap-2 p-2 bg-gray-900/30 rounded cursor-pointer hover:bg-gray-900/50"
                  >
                    <input
                      type="checkbox"
                      checked={preferredMaps.includes(map.value)}
                      onChange={() => handleMapToggle(map.value)}
                      className="rounded bg-gray-700 border-gray-600 text-cs2-accent focus:ring-cs2-accent"
                    />
                    <span className="text-white">{map.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Stockage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Espace utilisé</span>
                <span className="text-white">
                  {storageUsedMb.toFixed(1)} MB / {maxStorageMb} MB
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cs2-accent h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Les demos sont automatiquement archivées après 7 jours et supprimées
                après 30 jours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" isLoading={isLoading}>
            Sauvegarder
          </Button>
          <Button type="button" variant="secondary" onClick={() => window.history.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}