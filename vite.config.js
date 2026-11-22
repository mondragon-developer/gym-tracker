import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { motionAssetsPlugin } from './scripts/motion-assets.mjs'
import { POSE_MODEL_PATH, POSE_MODEL_VERSION, POSE_RUNTIME_VERSION, POSE_WASM_BASE_PATH, POSE_WASM_FILES } from './src/motion/modelAssets.js'

// Workbox serializes this callback into the service worker. Keep its allowlist
// self-contained; the configuration check below detects asset-version drift.
const isMotionAssetRequest = ({ url, sameOrigin }) => sameOrigin && url.search === '' && [
  '/motion-assets/tasks-vision/1.2.3/vision_wasm_module_internal.js',
  '/motion-assets/tasks-vision/1.2.3/vision_wasm_module_internal.wasm',
  '/motion-assets/pose-landmarker-lite/float16/1/pose_landmarker_lite.task',
].includes(url.pathname)

const workerFileName = chunk => (chunk.moduleIds ?? []).some(id =>
  id.includes('/src/motion/') || id.includes('/@mediapipe/tasks-vision/'))
  ? 'assets/squat-pose-worker-[name]-[hash].js'
  : 'assets/[name]-[hash].js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const pilotEnabled = env.VITE_ENABLE_SQUAT_PILOT === 'true'
  const motionPaths = [...POSE_WASM_FILES.map(name => `${POSE_WASM_BASE_PATH}/${name}`), POSE_MODEL_PATH]
  if (pilotEnabled && !motionPaths.every(path => isMotionAssetRequest({ url: new URL(path, 'https://gym.invalid'), sameOrigin: true }))) {
    throw new Error('The motion asset cache allowlist must match the pinned model and runtime versions.')
  }
  return {
    worker: {
      format: 'es',
      rollupOptions: { output: { entryFileNames: workerFileName, chunkFileNames: workerFileName } },
    },
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: chunk => chunk.name === 'SquatPilotModal'
            ? 'assets/squat-pilot-[hash].js'
            : 'assets/[name]-[hash].js',
        },
      },
    },
    plugins: [
      react(),
      pilotEnabled && motionAssetsPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        // main.jsx registers the worker itself so it can poll for updates.
        injectRegister: false,
        includeAssets: ['favicon.svg', 'pwa-icon.jpeg'],
        manifest: {
          name: 'Gym Tracker',
          short_name: 'Gym Tracker',
          description: 'Plan and track your weekly Push/Pull/Leg workouts.',
          theme_color: '#0f172a',
          background_color: '#ecf5fa',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'pwa-icon.jpeg', sizes: '192x192', type: 'image/jpeg' },
            { src: 'pwa-icon.jpeg', sizes: '512x512', type: 'image/jpeg' },
            { src: 'pwa-icon.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,jpeg,ico}'],
          // The optional pilot must not download during ordinary PWA installation.
          globIgnores: [
            'motion-assets/**',
            'assets/squat-pilot-*.js',
            'assets/squat-pose-worker-*.js',
            'assets/SquatPilotModal-*.css',
          ],
          runtimeCaching: pilotEnabled ? [{
            urlPattern: isMotionAssetRequest,
            handler: 'CacheFirst',
            method: 'GET',
            options: {
              cacheName: `gym-motion-assets-sdk-${POSE_RUNTIME_VERSION}-model-${POSE_MODEL_VERSION}`,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 3, maxAgeSeconds: 31536000, purgeOnQuotaError: true },
            },
          }] : [],
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
      include: ['src/**/*.{test,spec}.{js,jsx}', 'supabase/functions/**/*.test.js', 'scripts/motion-evaluation/**/*.test.js'],
    },
  }
})
