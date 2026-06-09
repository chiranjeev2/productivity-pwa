import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // This tells the browser what your app looks like when installed
      manifest: {
        name: 'Productivity Pro',
        short_name: 'ProdPro',
        description: 'A real-time task manager',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone', // This hides the browser URL bar!
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      // This configures the Service Worker to cache your files for fast loading
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
});