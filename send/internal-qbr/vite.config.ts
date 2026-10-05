import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The CSV lives in ../data and is bundled via a `?raw` import; Vite detects the
// npm-workspace root and allows serving files from it.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  // Recharts alone is ~400 kB; this is a local dashboard, so one bundle is fine.
  build: { chunkSizeWarningLimit: 900 },
});
