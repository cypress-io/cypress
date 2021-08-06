import { defineConfig } from 'cypress'
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin'
import { startDevServer } from '@cypress/webpack-dev-server'
import webpackConfig from './cypress/plugins/webpack.config'

export default defineConfig({
  experimentalFetchPolyfill: true,
  fixturesFolder: false,
  includeShadowDom: true,
  fileServerFolder: 'src',
  projectId: 'nf7zag',
  component: {
    componentFolder: '.',
    testFiles: 'src/app/**/*cy-spec.ts',
    setupDevServer (options) {
      return startDevServer({
        options,
        webpackConfig,
      })
    },
    setupNodeEvents (on, config) {
      addMatchImageSnapshotPlugin(on, config)

      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
