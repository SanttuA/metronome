/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// The site is served from https://<user>.github.io/metronome/
export default defineConfig({
  base: '/metronome/',
  plugins: [
    react(),
    VitePWA({
      // The app asks before reloading so an update never interrupts playback.
      registerType: 'prompt',
      injectRegister: false,
      // workbox.globPatterns already precaches every icon in public/.
      includeManifestIcons: false,
      manifest: {
        name: 'Metronome',
        short_name: 'Metronome',
        description: 'A simple, precise metronome with adjustable tempo and time signature.',
        lang: 'en',
        display: 'standalone',
        theme_color: '#0e0d14',
        background_color: '#0e0d14',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
    },
  },
});
