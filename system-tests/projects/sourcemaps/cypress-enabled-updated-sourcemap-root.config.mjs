import path from 'node:path'
import os from 'node:os'
import cypressPreprocessor from './cypress-preprocessor-enabled-updated-sourcemap-root.config.mjs'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      cypressPreprocessor(on, config)
    },
  },
  env: {
    areSourceMapsAvailable: true,
    sourceMapProjectRoot: path.join(os.tmpdir(), 'cy-projects/sourcemaps/cypress'),
  },
})
