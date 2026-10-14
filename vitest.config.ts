import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so the PWA plugin (service worker, manifest)
// never gets pulled into the test run - these are plain unit tests of pure
// logic, not a browser environment.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
