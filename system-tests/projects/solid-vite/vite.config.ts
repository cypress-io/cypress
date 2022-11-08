// This Vite config is only used for testing, not building!
// For building this package, check out rollup.config.ts

import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
})
