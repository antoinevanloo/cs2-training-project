'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    // Vérifier l'extension
    if (!file.name.endsWith('.dem')) {
      setError('Seuls les fichiers .dem sont acceptés');
      return;
    }

    // Vérifier la taille (max 300MB)
    const maxSize = 300 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Le fichier ne doit pas dépasser 300 MB');
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simuler la progression pour l'UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/demos/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      setUploadProgress(100);

      const data = await response.json();

      // Rediriger vers la page de la demo
      setTimeout(() => {
        router.push(`/dashboard/demos/${data.demo.id}`);
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload';

      // Si l'erreur contient une indication de redirection vers settings
      if (errorMessage.includes('Steam ID')) {
        setError('Vous devez configurer votre Steam ID avant de pouvoir uploader des demos.');
        setTimeout(() => {
          router.push('/dashboard/settings');
        }, 2000);
      } else {
        setError(errorMessage);
      }

      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Uploader une demo</h1>
        <p className="text-gray-400 mt-1">
          Uploadez votre fichier .dem pour l&apos;analyser
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fichier de demo</CardTitle>
          <CardDescription>
            Glissez-déposez votre fichier ou cliquez pour sélectionner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-cs2-accent bg-cs2-accent/10'
                : 'border-gray-600 hover:border-gray-500'
            } ${file ? 'border-green-500 bg-green-500/10' : ''}`}
          >
            {file ? (
              <div className="space-y-2">
                <svg
                  className="w-12 h-12 text-green-400 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                {!isUploading && (
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <svg
                  className="w-12 h-12 text-gray-500 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <div>
                  <p className="text-white">
                    Glissez-déposez votre fichier .dem ici
                  </p>
                  <p className="text-gray-400 text-sm mt-1">ou</p>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".dem"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="btn-secondary cursor-pointer">
                    Parcourir les fichiers
                  </span>
                </label>
                <p className="text-xs text-gray-500">
                  Fichiers .dem uniquement, max 300 MB
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} showLabel />
              <p className="text-sm text-gray-400 mt-2 text-center">
                {uploadProgress < 100
                  ? 'Upload en cours...'
                  : 'Traitement en cours...'}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              isLoading={isUploading}
              className="w-full"
            >
              {isUploading ? 'Upload en cours...' : 'Uploader et analyser'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-gray-400">
            <p className="font-medium text-white mb-1">
              Comment trouver vos demos ?
            </p>
            <p>
              Vos fichiers de demo CS2 se trouvent généralement dans :<br />
              <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">
                Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/
              </code>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
