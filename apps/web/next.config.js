/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Désactiver la génération statique pour les routes API
  experimental: {
    // Désactiver certaines optimisations qui causent des problèmes
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
