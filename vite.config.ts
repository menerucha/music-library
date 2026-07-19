import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import federation from '@originjs/vite-plugin-federation';

// This app is the Module Federation REMOTE.
// It exposes a single entry point ("./MusicLibrary") that the host
// dynamically imports at runtime. Nothing here is bundled into the host —
// the host fetches remoteEntry.js over HTTP, so this app can be built,
// deployed, and versioned completely independently of music-host.
export default defineConfig({
  plugins: [
    // federation must come before react() per @originjs/vite-plugin-federation docs
    federation({
      name: 'music_library',
      filename: 'remoteEntry.js',
      exposes: {
        // The component the host (music-host) imports as 'music_library/MusicLibrary'
        './MusicLibrary': './src/MusicLibrary.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '*' },
        'react-dom': { singleton: true, requiredVersion: '*' },
        '@tanstack/react-query': { singleton: true, requiredVersion: '*' },
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
    outDir: 'dist',
  },
  server: {
    port: 5001,
    host: true,
    cors: true,
  },
  preview: {
    port: 5001,
    host: true,
    cors: true,
  },
});
