import path from 'node:path'
import os from 'node:os'
import cypressPreprocessor from './cypress-preprocessor-disabled.config.mjs'

export default {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      cypressPreprocessor(on, config)
    },
  },
  env: {
    areSourceMapsAvailable: false,
    sourceMapProjectRoot: path.join(os.tmpdir(), 'cy-projects/sourcemaps'),
  },
}
