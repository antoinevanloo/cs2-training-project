import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CS2 Coach - Analyse de demos et coaching personnalisé',
  description:
    'Plateforme de coaching CS2 avec analyse automatique de vos demos et recommandations personnalisées pour améliorer votre gameplay.',
  keywords: ['CS2', 'Counter-Strike 2', 'coaching', 'analyse', 'demo', 'esport'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
