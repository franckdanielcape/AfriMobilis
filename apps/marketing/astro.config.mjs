// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  
  vite: {
    plugins: [tailwindcss()]
  },
  
  // Pour le déploiement statique
  output: 'static',
  
  // Site URL (à modifier après déploiement)
  site: 'https://afrimobilis.com',
  
  // Configuration des routes
  trailingSlash: 'never'
});
