import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.jpeg'],
      manifest: {
        name: 'Gym Tracker',
        short_name: 'Gym Tracker',
        description: 'Plan and track your weekly Push/Pull/Leg workouts.',
        theme_color: '#06b6d4',
        background_color: '#e9f7be',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-icon.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: 'pwa-icon.jpeg', sizes: '512x512', type: 'image/jpeg' },
          { src: 'pwa-icon.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpeg,ico}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
