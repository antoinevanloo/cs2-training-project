'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cs2-darker flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">500</h1>
        <p className="text-xl text-gray-400 mb-8">Une erreur est survenue</p>
        <button
          onClick={reset}
          className="inline-block px-6 py-3 bg-cs2-accent text-white rounded-lg hover:bg-cs2-accent/80 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
