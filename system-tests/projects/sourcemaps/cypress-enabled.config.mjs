import path from 'node:path'
import os from 'node:os'

module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
    },
  },
  env: {
    areSourceMapsAvailable: true,
    sourceMapProjectRoot: path.join(os.tmpdir(), 'cy-projects/sourcemaps'),
  },
}
