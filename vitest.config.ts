import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Same automatic JSX runtime the apps build with (@vitejs/plugin-react), so modules that create
  // JSX at import time (e.g. PillarIcon) load in tests without importing React.
  esbuild: { jsx: 'automatic' },
  test: { include: ['shared/src/**/*.test.ts', 'internal-qbr/src/**/*.test.ts'] },
});
