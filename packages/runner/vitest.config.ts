import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/unit/**/*.spec.ts'],
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // The cross-origin injection only runs in an AUT on a secondary origin
        url: 'http://foobar.com:3500/fixtures/secondary-origin.html',
      },
    },
  },
})
