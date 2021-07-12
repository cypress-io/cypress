import { defineConfig } from 'cypress'
import { startDevServer } from '@cypress/webpack-dev-server'
import webpackConfig from './webpack.config'

export default defineConfig({
  viewportWidth: 500,
  viewportHeight: 500,
  video: false,
  responseTimeout: 2500,
  projectId: '134ej7',
  testFiles: '**/*spec.js',
  experimentalFetchPolyfill: true,
  component: (on, config) => {
    if (config.testingType !== 'component') {
      throw Error(`This is a component testing project. testingType should be 'component'. Received ${config.testingType}`)
    }

    if (!webpackConfig.resolve) {
      webpackConfig.resolve = {}
    }

    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '@vue/compiler-core$': '@vue/compiler-core/dist/compiler-core.cjs.js',
    }

    require('@cypress/code-coverage/task')(on, config)
    on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

    return config
  },
  e2e (_, config) {
    config.includeShadowDom = true

    return config
  },
})
