'use client';

import { useState } from 'react';
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

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setMessage({ type: 'success', text: 'Paramètres sauvegardés' });
    setIsLoading(false);
  };

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
              defaultValue=""
            />
            <Input
              label="Steam ID (optionnel)"
              placeholder="76561198000000000"
              defaultValue=""
            />
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
                <span className="text-white">125 MB / 500 MB</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cs2-accent h-2 rounded-full"
                  style={{ width: '25%' }}
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
          <Button type="button" variant="secondary">
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
