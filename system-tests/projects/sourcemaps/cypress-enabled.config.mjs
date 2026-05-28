import path from 'node:path'
import os from 'node:os'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
    },
  },
  env: {
    areSourceMapsAvailable: true,
    sourceMapProjectRoot: path.join(os.tmpdir(), 'cy-projects/sourcemaps'),
  },
})
