import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cs2-dark to-cs2-darker">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cs2-dark/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cs2-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CS</span>
              </div>
              <span className="text-xl font-bold text-white">CS2 Coach</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-ghost">
                Connexion
              </Link>
              <Link href="/register" className="btn-primary">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Améliorez votre{' '}
            <span className="text-cs2-accent">gameplay CS2</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Analysez automatiquement vos demos, identifiez vos faiblesses et
            recevez des recommandations de coaching personnalisées pour progresser
            rapidement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Commencer gratuitement
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-3">
              Découvrir les fonctionnalités
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-cs2-accent">50+</div>
              <div className="text-gray-400 mt-1">Métriques analysées</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cs2-accent">6</div>
              <div className="text-gray-400 mt-1">Catégories de coaching</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cs2-accent">100%</div>
              <div className="text-gray-400 mt-1">Gratuit</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cs2-accent">7</div>
              <div className="text-gray-400 mt-1">Maps supportées</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Tout ce dont vous avez besoin pour progresser
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-cs2-accent/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-cs2-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Analyse de l&apos;aim
              </h3>
              <p className="text-gray-400">
                Évaluez votre précision, placement de crosshair, temps de
                réaction et contrôle du spray avec des métriques détaillées.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-cs2-ct/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-cs2-ct"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Positionnement
              </h3>
              <p className="text-gray-400">
                Analysez vos positions de mort, votre contrôle de map et
                identifiez les erreurs de positionnement récurrentes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-cs2-t/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-cs2-t"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Utilisation des grenades
              </h3>
              <p className="text-gray-400">
                Mesurez l&apos;efficacité de vos flashs, smokes, molotovs et HE.
                Apprenez à mieux utiliser vos utilitaires.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Gestion économique
              </h3>
              <p className="text-gray-400">
                Évaluez vos décisions d&apos;achat et de save. Optimisez votre
                économie pour maximiser vos chances de victoire.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Timing et réactivité
              </h3>
              <p className="text-gray-400">
                Analysez vos timings de peek, vitesse de trade et rotations.
                Améliorez votre synchronisation avec l&apos;équipe.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Prise de décision
              </h3>
              <p className="text-gray-400">
                Évaluez vos performances en clutch, retakes et votre niveau
                d&apos;agressivité. Prenez de meilleures décisions in-game.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-cs2-accent/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à passer au niveau supérieur ?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Uploadez votre première démo et découvrez comment améliorer votre
            gameplay en quelques minutes.
          </p>
          <Link href="/register" className="btn-primary text-lg px-8 py-3">
            Créer un compte gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cs2-accent rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">CS</span>
            </div>
            <span className="text-sm text-gray-400">
              CS2 Coach - Coaching personnalisé pour Counter-Strike 2
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Non affilié à Valve Corporation
          </div>
        </div>
      </footer>
    </div>
  );
}
