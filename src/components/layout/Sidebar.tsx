'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Globe,
  Map,
  FileText,
  Upload,
  BarChart2,
  Target,
  Settings,
  GitCompare,
  Share2,
  Users,
  Brain,
  Dumbbell,
  Crown,
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

// Navigation principale avec hiérarchie de granularité
const navigation = [
  {
    name: 'Vue d\'ensemble',
    href: '/dashboard/overview',
    icon: Globe,
    badge: 'Global',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    description: 'Stats agrégées',
  },
  {
    name: 'Par Map',
    href: '/dashboard/maps',
    icon: Map,
    badge: 'Map',
    badgeColor: 'bg-green-500/20 text-green-400',
    description: 'Stats par map',
  },
  {
    name: 'Mes Démos',
    href: '/dashboard/demos',
    icon: FileText,
    badge: 'Démo',
    badgeColor: 'bg-orange-500/20 text-orange-400',
    description: 'Parties individuelles',
  },
  {
    name: 'Upload',
    href: '/dashboard/demos/upload',
    icon: Upload,
    description: 'Ajouter une démo',
  },
];

// Navigation secondaire - Outils d'analyse
const secondaryNavigation = [
  {
    name: 'Coaching',
    href: '/dashboard/coaching',
    icon: Target,
    description: 'Recommandations',
  },
  {
    name: 'Comparer',
    href: '/dashboard/compare',
    icon: GitCompare,
    description: 'Comparaison démos',
  },
  {
    name: 'Statistiques',
    href: '/dashboard/stats',
    icon: BarChart2,
    description: 'Stats détaillées',
  },
  {
    name: 'Export',
    href: '/dashboard/export',
    icon: Share2,
    description: 'Export & partage',
  },
];

// Navigation premium
const premiumNavigation = [
  {
    name: 'Coach IA',
    href: '/dashboard/coach',
    icon: Brain,
    description: 'Assistant coaching',
    premium: true,
  },
  {
    name: 'Équipe',
    href: '/dashboard/team',
    icon: Users,
    description: 'Analyse équipe',
    premium: true,
  },
  {
    name: 'Entraînement',
    href: '/dashboard/training',
    icon: Dumbbell,
    description: 'Mode training',
    premium: true,
  },
];

// Navigation settings
const settingsNavigation = [
  {
    name: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configuration',
  },
];

function getActiveHref(pathname: string): string | undefined {
  // Priorité aux chemins plus spécifiques
  const allNav = [...navigation, ...secondaryNavigation, ...premiumNavigation, ...settingsNavigation];
  return allNav
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);
  const isAdminPage = pathname.startsWith('/dashboard/admin');

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-800">
            <div className="w-8 h-8 bg-cs2-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CS</span>
            </div>
            <span className="text-xl font-bold text-white">CS2 Coach</span>
          </div>

          {/* Navigation principale */}
          <nav className="flex-1 px-3 py-4">
            {/* Section: Données */}
            <div className="mb-6">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Données
              </div>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === activeHref;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-cs2-accent text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section: Outils */}
            <div className="mb-6">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Outils
              </div>
              <div className="space-y-1">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === activeHref;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-cs2-accent text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section: Premium */}
            <div className="mb-6">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                Premium
              </div>
              <div className="space-y-1">
                {premiumNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === activeHref;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/20 to-cs2-accent/20 text-white border border-purple-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                      {item.premium && !isActive && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">
                          PRO
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section: Settings */}
            <div className="mb-6">
              <div className="space-y-1">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === activeHref;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-cs2-accent text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Admin Link */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-800">
                <Link
                  href="/dashboard/admin"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isAdminPage
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Légende de granularité */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 mb-3">Niveaux de données</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-400">Global - Toutes parties</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400">Map - Par map</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs text-gray-400">Démo - Par partie</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs text-gray-400">Round - Par round</span>
              </div>
            </div>
          </div>

          {/* Storage Info */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-400 mb-2">Stockage utilisé</div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-cs2-accent h-2 rounded-full"
                style={{ width: '25%' }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">125 MB / 500 MB</div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50">
        <div className="flex justify-around py-2">
          {[
            { name: 'Global', href: '/dashboard/overview', icon: Globe },
            { name: 'Démos', href: '/dashboard/demos', icon: FileText },
            { name: 'Coach', href: '/dashboard/coach', icon: Brain },
            { name: 'Training', href: '/dashboard/training', icon: Dumbbell },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive ? 'text-cs2-accent' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
