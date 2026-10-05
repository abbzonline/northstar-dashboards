import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Customer-facing dashboard. Same CSV and shared package as the internal app, on its own ports.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 4174 },
  // Recharts alone is ~400 kB; this is a local dashboard, so one bundle is fine.
  build: { chunkSizeWarningLimit: 900 },
});
