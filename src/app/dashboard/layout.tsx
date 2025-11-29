import { requireAuth } from '@/lib/auth/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cs2-dark to-cs2-darker">
      <Sidebar />
      <div className="lg:pl-64">
        <Header user={user} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
