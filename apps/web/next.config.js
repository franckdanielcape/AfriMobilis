/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Configuration pour stabilité en développement
  webpack: (config, { dev, isServer }) => {
    // Désactiver le cache persistant en dev pour éviter les problèmes HMR
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // Forcer le rechargement complet quand nécessaire
  onDemandEntries: {
    // Période de conservation des pages en mémoire (ms)
    maxInactiveAge: 15 * 1000,
    // Nombre de pages à garder en mémoire
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
