'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  FileVideo,
  BarChart3,
  UsersRound,
  CreditCard,
  Settings,
  SlidersHorizontal,
  ChevronLeft,
  Shield,
  Map,
} from 'lucide-react';
import { getActiveModules, type AdminModule } from '@/lib/admin/config';

// Map des icônes
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Target,
  FileVideo,
  BarChart3,
  UsersRound,
  CreditCard,
  Settings,
  SlidersHorizontal,
  Map,
};

interface AdminSidebarProps {
  currentUser: {
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function AdminSidebar({ currentUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const modules = getActiveModules();

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-white">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-2"
        >
          <ChevronLeft className="w-3 h-3" />
          Retour au dashboard
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {modules.map((module) => {
          const Icon = iconMap[module.icon] || Settings;
          const active = isActive(module.href);

          return (
            <div key={module.id}>
              <Link
                href={module.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{module.name}</span>
              </Link>

              {/* Sous-modules */}
              {module.children && active && (
                <div className="ml-8 mt-1 space-y-1">
                  {module.children
                    .filter((c) => c.enabled)
                    .map((child) => {
                      const ChildIcon = iconMap[child.icon] || Settings;
                      const childActive = pathname === child.href;

                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                            childActive
                              ? 'text-red-400'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 font-bold text-sm">
              {currentUser.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentUser.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
          </div>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">
            ADMIN
          </span>
        </div>
      </div>
    </aside>
  );
}