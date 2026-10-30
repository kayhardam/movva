import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ['src/**/*.test.ts'],
    // Run the tests in Dutch time, so the daylight saving switches really happen.
    env: { TZ: 'Europe/Amsterdam' },
  },
})
