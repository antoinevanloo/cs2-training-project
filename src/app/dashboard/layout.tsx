import { requireAuth } from '@/lib/auth/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import prisma from '@/lib/db/prisma';

// Forcer le rendu dynamique pour toutes les pages du dashboard
// car elles nécessitent l'authentification et des données utilisateur
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Vérifier si l'utilisateur est admin
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { systemRole: true },
  });
  const isAdmin = userData?.systemRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-b from-cs2-dark to-cs2-darker">
      <Sidebar isAdmin={isAdmin} />
      <div className="lg:pl-64">
        <Header user={user} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
