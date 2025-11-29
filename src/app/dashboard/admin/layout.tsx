import { requireAdmin } from '@/lib/admin/guard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérifie que l'utilisateur est admin, redirige sinon
  const adminUser = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar
        currentUser={{
          username: adminUser.username,
          email: adminUser.email,
          avatarUrl: adminUser.avatarUrl,
        }}
      />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
