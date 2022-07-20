// This Vite config is only used for testing, not building!
// For building this package, check out rollup.config.ts

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    svelte(),
  ],
})
