import { defineConfig } from 'cypress'

// import.meta.resolve must be present within an ESM context
// @ts-expect-error there is no tsconfig.json, but tsx should still load this config as ESM
import.meta.resolve

export default defineConfig({
  allowCypressEnv: false,
  e2e: { supportFile: false },
})
