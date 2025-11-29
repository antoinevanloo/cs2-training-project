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

interface RoleOption {
  value: string;
  label: string;
}

interface TierLimits {
  demosPerMonth: number;
  historyDays: number;
  storageMaxMb: number;
}

interface UserSettings {
  username: string;
  steamId: string | null;
  role: string | null;
  rank: string | null;
  preferredMaps: string[];
  storageUsedMb: number;
  maxStorageMb: number;
  availableRoles?: RoleOption[];
  availableRanks?: RoleOption[];
  // Subscription info
  systemRole: string;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  demosThisMonth: number;
  effectiveTier: string;
  tierName: string;
  tierLimits: TierLimits;
  tierFeatures: string[];
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [username, setUsername] = useState('');
  const [steamId, setSteamId] = useState('');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');
  const [preferredMaps, setPreferredMaps] = useState<string[]>([]);
  const [storageUsedMb, setStorageUsedMb] = useState(0);
  const [maxStorageMb, setMaxStorageMb] = useState(500);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [availableRanks, setAvailableRanks] = useState<RoleOption[]>([]);

  // Subscription state
  const [tierName, setTierName] = useState('Free');
  const [effectiveTier, setEffectiveTier] = useState('FREE');
  const [demosThisMonth, setDemosThisMonth] = useState(0);
  const [tierLimits, setTierLimits] = useState<TierLimits>({ demosPerMonth: 3, historyDays: 7, storageMaxMb: 200 });
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Charger les données utilisateur
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data: UserSettings = await response.json();
          setUsername(data.username || '');
          setSteamId(data.steamId || '');
          setRole(data.role || '');
          setRank(data.rank || '');
          setPreferredMaps(data.preferredMaps || []);
          setStorageUsedMb(data.storageUsedMb || 0);
          setMaxStorageMb(data.maxStorageMb || 500);
          setAvailableRoles(data.availableRoles || []);
          setAvailableRanks(data.availableRanks || []);
          // Subscription info
          setTierName(data.tierName || 'Free');
          setEffectiveTier(data.effectiveTier || 'FREE');
          setDemosThisMonth(data.demosThisMonth || 0);
          setTierLimits(data.tierLimits || { demosPerMonth: 3, historyDays: 7, storageMaxMb: 200 });
          setSubscriptionExpiresAt(data.subscriptionExpiresAt);
          setIsAdmin(data.systemRole === 'ADMIN');
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
          role: role || null,
          rank: rank || null,
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

      {/* Subscription Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Abonnement</CardTitle>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              effectiveTier === 'FREE' ? 'bg-gray-600 text-gray-200' :
              effectiveTier === 'PRO' ? 'bg-blue-600 text-white' :
              effectiveTier === 'PRO_PLUS' ? 'bg-purple-600 text-white' :
              effectiveTier === 'TEAM' ? 'bg-green-600 text-white' :
              'bg-yellow-600 text-black'
            }`}>
              {tierName}
              {isAdmin && ' (Admin)'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Demos this month */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Demos ce mois</span>
                <span className="text-white">
                  {tierLimits.demosPerMonth === -1 ? (
                    <>{demosThisMonth} / Illimité</>
                  ) : (
                    <>{demosThisMonth} / {tierLimits.demosPerMonth}</>
                  )}
                </span>
              </div>
              {tierLimits.demosPerMonth !== -1 && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      demosThisMonth >= tierLimits.demosPerMonth ? 'bg-red-500' : 'bg-cs2-accent'
                    }`}
                    style={{ width: `${Math.min((demosThisMonth / tierLimits.demosPerMonth) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Expiration */}
            {subscriptionExpiresAt && effectiveTier !== 'FREE' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Expire le</span>
                <span className="text-white">
                  {new Date(subscriptionExpiresAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Features */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Fonctionnalités incluses :</p>
              <div className="flex flex-wrap gap-2">
                {effectiveTier === 'FREE' ? (
                  <>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">Stats de base</span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">Conseils basiques</span>
                  </>
                ) : effectiveTier === 'PRO' ? (
                  <>
                    <span className="px-2 py-1 bg-blue-900/50 rounded text-xs text-blue-300">Analyse complète</span>
                    <span className="px-2 py-1 bg-blue-900/50 rounded text-xs text-blue-300">Coaching avancé</span>
                    <span className="px-2 py-1 bg-blue-900/50 rounded text-xs text-blue-300">Export PDF</span>
                    <span className="px-2 py-1 bg-blue-900/50 rounded text-xs text-blue-300">Suivi progression</span>
                  </>
                ) : effectiveTier === 'PRO_PLUS' ? (
                  <>
                    <span className="px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-300">Tout PRO +</span>
                    <span className="px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-300">Coaching IA</span>
                    <span className="px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-300">Comparaison Pro</span>
                  </>
                ) : (
                  <span className="px-2 py-1 bg-green-900/50 rounded text-xs text-green-300">Toutes les fonctionnalités</span>
                )}
              </div>
            </div>

            {/* Upgrade CTA */}
            {effectiveTier === 'FREE' && (
              <div className="pt-2 border-t border-gray-700">
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                  onClick={() => {/* TODO: redirect to pricing page */}}
                >
                  Passer à Pro - 6€/mois
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Demos illimités, analyse complète, suivi de progression
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

        {/* Rôle et Rang */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil de joueur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select
                label="Rôle principal"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: '', label: 'Non défini' },
                  ...availableRoles,
                ]}
              />
              <p className="mt-1 text-xs text-gray-500">
                Votre rôle influence les conseils de coaching. Un AWPer isolé ou un Entry qui meurt beaucoup ne recevront pas les mêmes alertes.
              </p>
            </div>

            <div>
              <Select
                label="Rang actuel"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                options={[
                  { value: '', label: 'Non défini' },
                  ...availableRanks,
                ]}
              />
              <p className="mt-1 text-xs text-gray-500">
                Les attentes sont ajustées selon votre rang. Un Silver n&apos;a pas les mêmes standards qu&apos;un Global.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Maps préférées */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Maps préférées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
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
                  {tierLimits.storageMaxMb === -1 ? (
                    <>{storageUsedMb.toFixed(1)} MB / Illimité</>
                  ) : (
                    <>{storageUsedMb.toFixed(1)} MB / {tierLimits.storageMaxMb} MB</>
                  )}
                </span>
              </div>
              {tierLimits.storageMaxMb !== -1 && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      storagePercentage >= 90 ? 'bg-red-500' : 'bg-cs2-accent'
                    }`}
                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                {tierLimits.historyDays === -1 ? (
                  'Historique illimité avec votre abonnement.'
                ) : (
                  `Les demos sont visibles pendant ${tierLimits.historyDays} jours. Passez à Pro pour un historique illimité.`
                )}
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
