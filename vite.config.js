import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // main.jsx registers the worker itself so it can poll for updates.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'pwa-icon.jpeg'],
      manifest: {
        name: 'Gym Tracker',
        short_name: 'Gym Tracker',
        description: 'Plan and track your weekly Push/Pull/Leg workouts.',
        theme_color: '#0e7490',
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
        // Without these the new worker only activates when the page posts
        // SKIP_WAITING, so a device still running an old bundle whose
        // registration code never sends it stays on that build for as long
        // as any tab or the installed app is open. Taking over on install
        // fires controllerchange, which main.jsx turns into a safe reload.
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['rest-timer-sw.js'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}', 'supabase/functions/**/*.test.js'],
  },
})
