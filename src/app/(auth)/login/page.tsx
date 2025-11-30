'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Icône Steam
function SteamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V22l.14-.01c.47.01.94-.02 1.4-.07 4.76-.51 8.46-4.56 8.46-9.42C20 6.48 15.52 2 12 2zm0 2c4.41 0 8 3.59 8 8 0 3.72-2.55 6.85-6 7.74v-3.02c1.3-.48 2.22-1.71 2.22-3.17 0-1.86-1.51-3.37-3.37-3.37-.46 0-.9.09-1.3.26L8.22 8.8A6.945 6.945 0 0 1 12 4zm-4.85 6.17l2.13.85c.21-.56.58-1.05 1.05-1.42l-2.26-.9c-.37.43-.68.92-.92 1.47zM8.5 13.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5zm9-1.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
    </svg>
  );
}

// Messages d'erreur Steam
const steamErrorMessages: Record<string, string> = {
  SteamAuthCancelled: 'Authentification Steam annulée',
  SteamAuthFailed: 'Échec de l\'authentification Steam',
  SteamAuthInvalid: 'Signature Steam invalide',
  SteamAuthNoId: 'Aucun identifiant Steam reçu',
  SteamAuthInvalidId: 'Identifiant Steam invalide',
  SteamNotConfigured: 'Steam non configuré sur le serveur',
  SteamProfileFailed: 'Impossible de récupérer le profil Steam',
  ConfigurationError: 'Erreur de configuration serveur',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSteamLoading, setIsSteamLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Construire le message d'erreur
  const errorMessage = loginError || (error && (steamErrorMessages[error] || 'Erreur d\'authentification'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError('Email ou mot de passe incorrect');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setLoginError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSteamLogin = () => {
    setIsSteamLoading(true);
    // Rediriger vers notre endpoint Steam avec le callback URL
    window.location.href = `/api/auth/steam?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-white text-center mb-2">
        Connexion
      </h1>
      <p className="text-gray-400 text-center mb-6">
        Connectez-vous pour accéder à votre dashboard
      </p>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {errorMessage}
        </div>
      )}

      {/* Bouton Steam */}
      <button
        type="button"
        onClick={handleSteamLogin}
        disabled={isSteamLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 bg-[#1b2838] hover:bg-[#2a475e] text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isSteamLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connexion à Steam...
          </>
        ) : (
          <>
            <SteamIcon className="h-6 w-6" />
            Se connecter avec Steam
          </>
        )}
      </button>

      {/* Séparateur */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-cs2-dark text-gray-500">ou</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            placeholder="votre@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isSteamLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-400">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-cs2-accent hover:underline">
          Créer un compte
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
