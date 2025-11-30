'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  CreditCard,
  Trash2,
  Edit,
  Loader2,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TIER_FILTER_OPTIONS, TIER_SELECT_OPTIONS, TIER_BG_COLORS } from '@/lib/constants/tiers';

interface User {
  id: string;
  email: string;
  username: string;
  steamId: string | null;
  avatarUrl: string | null;
  systemRole: string;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  storageUsedMb: number;
  demosThisMonth: number;
  role: string | null;
  rank: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    demos: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const tierOptions = TIER_FILTER_OPTIONS;

const roleOptions = [
  { value: '', label: 'Tous les rôles' },
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
];

const tierColors = TIER_BG_COLORS;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    systemRole: '',
    subscriptionTier: '',
    subscriptionExpiresAt: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        tier: tierFilter,
        role: roleFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, tierFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      systemRole: user.systemRole,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt
        ? new Date(user.subscriptionExpiresAt).toISOString().split('T')[0]
        : '',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      systemRole: '',
      subscriptionTier: '',
      subscriptionExpiresAt: '',
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          updates: {
            systemRole: editForm.systemRole,
            subscriptionTier: editForm.subscriptionTier,
            subscriptionExpiresAt: editForm.subscriptionExpiresAt || null,
          },
        }),
      });

      if (response.ok) {
        closeEditModal();
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Gestion des utilisateurs</h1>
        <p className="text-gray-400 mt-1">
          {pagination.total} utilisateur{pagination.total > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou Steam ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <Select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={tierOptions}
            />
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={roleOptions}
            />
            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Utilisateur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Rôle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Demos</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Inscrit le</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-300">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.username}</p>
                              {user.steamId && (
                                <p className="text-xs text-gray-500">{user.steamId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-300">{user.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${tierColors[user.subscriptionTier]}`}>
                            {user.subscriptionTier}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.systemRole === 'ADMIN' ? (
                            <span className="flex items-center gap-1 text-red-400 text-sm">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">User</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-300">{user._count.demos}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Page {pagination.page} sur {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Modifier l&apos;utilisateur</h2>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Utilisateur</p>
                <p className="text-white font-medium">{editingUser.username}</p>
                <p className="text-sm text-gray-500">{editingUser.email}</p>
              </div>

              <Select
                label="Rôle système"
                value={editForm.systemRole}
                onChange={(e) => setEditForm({ ...editForm, systemRole: e.target.value })}
                options={[
                  { value: 'USER', label: 'User' },
                  { value: 'ADMIN', label: 'Admin' },
                ]}
              />

              <Select
                label="Tier d'abonnement"
                value={editForm.subscriptionTier}
                onChange={(e) => setEditForm({ ...editForm, subscriptionTier: e.target.value })}
                options={TIER_SELECT_OPTIONS}
              />

              <Input
                type="date"
                label="Date d'expiration"
                value={editForm.subscriptionExpiresAt}
                onChange={(e) => setEditForm({ ...editForm, subscriptionExpiresAt: e.target.value })}
              />
              <p className="text-xs text-gray-500 -mt-2">
                Laisser vide pour pas d&apos;expiration (FREE ou lifetime)
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={closeEditModal}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveUser}
                isLoading={isSaving}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}