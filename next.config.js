/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg-boss'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
      },
    ],
  },
  // Augmenter la limite pour les uploads de fichiers
  api: {
    bodyParser: {
      sizeLimit: '150mb',
    },
  },
};

module.exports = nextConfig;
