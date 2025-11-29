'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Construction } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1">Configuration globale de la plateforme</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Construction className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">En construction</h2>
            <p className="text-gray-400 max-w-md">
              Cette section permettra de configurer les paramètres globaux de la plateforme :
              intégrations Stripe, emails, limites par défaut, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Future sections preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
        <Card>
          <CardHeader>
            <CardTitle>Intégration Stripe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Configurer les clés API Stripe et les produits/prix.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Configuration SMTP et templates d&apos;emails.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limites par défaut</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Définir les limites par défaut pour les nouveaux utilisateurs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Mode maintenance, nettoyage des données, backups.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}