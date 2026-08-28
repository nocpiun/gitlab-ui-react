import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'packages/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
      'apps/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
    ],
  },
});
