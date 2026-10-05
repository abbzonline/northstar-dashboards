import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['shared/src/**/*.test.ts', 'internal-qbr/src/**/*.test.ts'] },
});
