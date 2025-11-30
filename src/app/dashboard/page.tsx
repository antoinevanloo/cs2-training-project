import { redirect } from 'next/navigation';

// Redirection vers la nouvelle page d'overview
export default function DashboardPage() {
  redirect('/dashboard/overview');
}