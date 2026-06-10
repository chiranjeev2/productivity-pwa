import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Productivity Pro',
        short_name: 'ProdPro',
        description: 'A real-time task manager',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone', 
        icons: [
          {
            // 🔴 FIXED: Changed path to match your actual file name
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            // 🔴 FIXED: Changed path to match your actual file name
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
});