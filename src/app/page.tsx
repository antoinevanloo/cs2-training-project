import Link from 'next/link';
import {
  CrosshairIcon,
  MapIcon,
  GrenadeIcon,
  EconomyIcon,
  TimingIcon,
  DecisionIcon,
  TrophyIcon,
  RankUpIcon,
  FireIcon,
} from '@/components/ui/icons/CS2Icons';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cs2-darker overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cs2-dark via-cs2-darker to-black" />
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="absolute inset-0 bg-grid-pattern" />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cs2-accent/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cs2-ct/10 rounded-full blur-3xl animate-float-slow delay-1000" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cs2-dark/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cs2-accent to-cs2-accent-dark rounded-lg flex items-center justify-center shadow-glow-sm">
                  <CrosshairIcon size={24} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-cs2-dark animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">CS2 Coach</span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">BETA</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Fonctionnalites</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">Comment ca marche</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Tarifs</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="
                  relative px-5 py-2.5
                  bg-gradient-to-r from-cs2-accent to-cs2-accent-light
                  text-white font-semibold
                  rounded-lg
                  shadow-glow-sm
                  hover:shadow-glow-md
                  transition-all duration-300
                  hover:scale-105
                  overflow-hidden
                  group
                "
              >
                <span className="relative z-10">Commencer</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cs2-accent-light to-cs2-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cs2-accent/10 border border-cs2-accent/30 mb-8 animate-fade-in-down">
              <FireIcon size={16} className="text-cs2-accent" />
              <span className="text-sm text-cs2-accent font-medium">
                Rejoins +1,000 joueurs qui progressent chaque jour
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in-up">
              Deviens le
              <span className="relative mx-4">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cs2-accent via-cs2-accent-light to-cs2-accent animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
                  Pro
                </span>
                <span className="absolute -inset-2 bg-cs2-accent/20 blur-xl rounded-lg" />
              </span>
              de CS2
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Analyse IA de tes demos, recommandations personnalisees et exercices concrets pour
              <span className="text-white font-semibold"> rank up </span>
              plus vite.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/register"
                className="
                  group relative px-8 py-4
                  bg-gradient-to-r from-cs2-accent to-cs2-accent-light
                  text-white text-lg font-bold
                  rounded-xl
                  shadow-glow-md
                  hover:shadow-glow-lg
                  transition-all duration-300
                  hover:scale-105
                  overflow-hidden
                "
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <RankUpIcon size={20} />
                  Commencer Gratuitement
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </Link>

              <Link
                href="#demo"
                className="
                  px-8 py-4
                  bg-gray-800/50 backdrop-blur
                  border border-gray-700
                  text-gray-300 text-lg font-semibold
                  rounded-xl
                  hover:bg-gray-800
                  hover:border-gray-600
                  hover:text-white
                  transition-all duration-300
                  flex items-center justify-center gap-2
                "
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Voir la Demo
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>100% Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>Aucune carte requise</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>Resultats en 2 min</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-cs2-darker via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur overflow-hidden shadow-2xl">
              {/* Mock Dashboard Preview */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Rating', value: '1.24', color: 'text-green-400' },
                    { label: 'ADR', value: '87.3', color: 'text-cs2-accent' },
                    { label: 'HS%', value: '52%', color: 'text-yellow-400' },
                    { label: 'KAST', value: '76%', color: 'text-blue-400' },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 animate-fade-in-up"
                      style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                    >
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Categories preview */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { name: 'Aim', score: 78, color: 'from-cs2-accent to-orange-600' },
                    { name: 'Position', score: 65, color: 'from-cs2-ct to-blue-600' },
                    { name: 'Utility', score: 82, color: 'from-cs2-t to-yellow-600' },
                    { name: 'Economy', score: 71, color: 'from-green-500 to-emerald-600' },
                    { name: 'Timing', score: 68, color: 'from-purple-500 to-violet-600' },
                    { name: 'Decision', score: 74, color: 'from-pink-500 to-rose-600' },
                  ].map((cat, i) => (
                    <div
                      key={cat.name}
                      className="relative p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${0.6 + i * 0.05}s` }}
                    >
                      <div
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${cat.color} opacity-20`}
                        style={{ height: `${cat.score}%` }}
                      />
                      <p className="relative text-xs text-gray-400">{cat.name}</p>
                      <p className="relative text-lg font-bold text-white">{cat.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50+', label: 'Metriques analysees', icon: <CrosshairIcon size={24} /> },
              { value: '6', label: 'Categories de coaching', icon: <TrophyIcon size={24} /> },
              { value: '19+', label: 'Regles intelligentes', icon: <DecisionIcon size={24} /> },
              { value: '7', label: 'Maps supportees', icon: <MapIcon size={24} /> },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center group" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cs2-accent/20 to-cs2-accent/5 border border-cs2-accent/20 text-cs2-accent mb-4 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Analyse Complete de ton
              <span className="text-cs2-accent"> Gameplay</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              6 categories d&apos;analyse pour couvrir tous les aspects de ton jeu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <CrosshairIcon size={28} />,
                title: 'Aim & Precision',
                description: 'Placement crosshair, temps de reaction, spray control, first bullet accuracy et stats par arme.',
                color: 'from-cs2-accent/20 to-transparent border-cs2-accent/30',
                iconColor: 'text-cs2-accent',
                features: ['HS% par arme', 'Spray transfers', 'Duel win rate'],
              },
              {
                icon: <MapIcon size={28} />,
                title: 'Positionnement',
                description: 'Analyse des positions de mort, controle de map, rotations et tradeability.',
                color: 'from-cs2-ct/20 to-transparent border-cs2-ct/30',
                iconColor: 'text-cs2-ct',
                features: ['Death clusters', 'Zone coverage', 'Trade rate'],
              },
              {
                icon: <GrenadeIcon size={28} />,
                title: 'Utilitaires',
                description: 'Efficacite des flashs, timing des smokes, dommages molotov/HE et coordination.',
                color: 'from-cs2-t/20 to-transparent border-cs2-t/30',
                iconColor: 'text-cs2-t',
                features: ['Flash assists', 'Smoke timing', 'Utility waste'],
              },
              {
                icon: <EconomyIcon size={28} />,
                title: 'Economie',
                description: 'Decisions d&apos;achat, force buys, impact sur l&apos;equipe et gestion de l&apos;argent.',
                color: 'from-green-500/20 to-transparent border-green-500/30',
                iconColor: 'text-green-400',
                features: ['Buy decisions', 'Save efficiency', 'Money at death'],
              },
              {
                icon: <TimingIcon size={28} />,
                title: 'Timing',
                description: 'Vitesse de trade, timing des peeks, rotations et prefire accuracy.',
                color: 'from-purple-500/20 to-transparent border-purple-500/30',
                iconColor: 'text-purple-400',
                features: ['Trade speed', 'Rotation time', 'Peek timing'],
              },
              {
                icon: <DecisionIcon size={28} />,
                title: 'Decision',
                description: 'Performance en clutch, decisions de retake, niveau d&apos;agressivite et risk taking.',
                color: 'from-pink-500/20 to-transparent border-pink-500/30',
                iconColor: 'text-pink-400',
                features: ['Clutch rate', 'Risk assessment', 'Aggression level'],
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`
                  group p-6 rounded-2xl
                  bg-gradient-to-br ${feature.color}
                  border
                  backdrop-blur-sm
                  transition-all duration-300
                  hover:scale-102
                  hover:shadow-card-hover
                `}
              >
                <div className={`w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>

                <div className="flex flex-wrap gap-2">
                  {feature.features.map((f) => (
                    <span key={f} className="px-2.5 py-1 text-xs rounded-full bg-gray-800/50 text-gray-300 border border-gray-700/50">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Comment ca
              <span className="text-cs2-accent"> marche ?</span>
            </h2>
            <p className="text-xl text-gray-400">
              3 etapes simples pour commencer a progresser
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload ta demo',
                description: 'Telecharge ton fichier .dem directement depuis CS2. Ca prend 30 secondes.',
                icon: '📤',
              },
              {
                step: '02',
                title: 'Analyse IA',
                description: 'Notre IA analyse 50+ metriques et identifie tes points forts et faiblesses.',
                icon: '🧠',
              },
              {
                step: '03',
                title: 'Progresse',
                description: 'Recois des recommandations personnalisees et des exercices concrets.',
                icon: '📈',
              },
            ].map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-cs2-accent/50 to-transparent -z-10" />
                )}

                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-5xl">
                      {step.icon}
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-cs2-accent flex items-center justify-center font-bold text-white shadow-glow-sm">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ils ont
              <span className="text-cs2-accent"> rank up</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "J'ai identifie que je mourais trop souvent au meme endroit sur Dust2. En changeant ma position, j'ai gagne 3 rangs en 2 semaines.",
                author: 'MaxKill_FR',
                rank: 'Gold Nova → MG2',
                avatar: '🎮',
              },
              {
                quote: "Les stats sur mes flashs m'ont ouvert les yeux. Je flashais mes teammates 40% du temps sans le savoir !",
                author: 'SmokeKing42',
                rank: 'Silver → Gold Nova',
                avatar: '💨',
              },
              {
                quote: "L'analyse de mes duels m'a montre que je perdais 70% des opening duels. Les exercices recommandes ont tout change.",
                author: 'HeadshotQueen',
                rank: 'MG1 → LE',
                avatar: '👑',
              },
            ].map((testimonial, i) => (
              <div
                key={testimonial.author}
                className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50 backdrop-blur"
              >
                <p className="text-gray-300 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cs2-accent to-cs2-accent-dark flex items-center justify-center text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-cs2-accent">{testimonial.rank}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-cs2-accent/20 via-cs2-dark to-cs2-darker border border-cs2-accent/30 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-hero-pattern opacity-20" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cs2-accent/20 rounded-full blur-3xl" />

            <div className="relative text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Pret a dominer ?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Rejoins des milliers de joueurs qui utilisent CS2 Coach pour progresser.
                C&apos;est gratuit, rapide et efficace.
              </p>

              <Link
                href="/register"
                className="
                  inline-flex items-center gap-3
                  px-10 py-5
                  bg-gradient-to-r from-cs2-accent to-cs2-accent-light
                  text-white text-xl font-bold
                  rounded-2xl
                  shadow-glow-lg
                  hover:shadow-glow-xl
                  transition-all duration-300
                  hover:scale-105
                "
              >
                <RankUpIcon size={24} />
                Creer mon compte gratuit
              </Link>

              <p className="mt-4 text-sm text-gray-500">
                Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cs2-accent to-cs2-accent-dark rounded-lg flex items-center justify-center">
                <CrosshairIcon size={20} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">CS2 Coach</span>
                <p className="text-xs text-gray-500">Coaching personnalise pour Counter-Strike 2</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Mentions legales</a>
              <a href="#" className="hover:text-white transition-colors">Confidentialite</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm text-gray-600">
              Non affilie a Valve Corporation
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}