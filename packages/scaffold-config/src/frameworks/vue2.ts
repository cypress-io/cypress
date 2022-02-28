import dedent from 'dedent'
import type { Bundler } from '../types'
import { BUNDLER_VITE, BUNDLER_WEBPACK_4, BUNDLER_WEBPACK_5, CODE_GEN_FRAMEWORKS, CYPRESS_VUE_2, FRONTEND_FRAMEWORK_CATEGORIES } from '../constants'
import { isWebpack } from './isWebpack'

export const vue2 = {
  type: 'vue2',
  name: 'Vue.js (v2)',
  family: 'library',
  supportedBundlers: [BUNDLER_WEBPACK_4, BUNDLER_WEBPACK_5, BUNDLER_VITE],
  packages: [CYPRESS_VUE_2],
  defaultPackagePath: null,
  glob: '*.vue',
  detectors: [
    {
      dependency: 'vue',
      version: '^2.0.0',
    },
  ],
  category: FRONTEND_FRAMEWORK_CATEGORIES[1],
  codeGenFramework: CODE_GEN_FRAMEWORKS[1],
  storybookDep: null,
  config: {
    js: (bundler: Bundler) => {
      if (isWebpack(bundler)) {
        return dedent`
        const { devServer } = require('@cypress/webpack-dev-server')
        // NOTE: ensure you are requiring your webpack config from the
        // correct location.
        const webpackConfig = require('./webpack.config.js')

        module.exports = {
          component: {
            devServer,
            devServerConfig: {
              webpackConfig
            }
          }
        }`
      }

      if (bundler === 'vite') {
        return dedent`
        const { devServer } = require('@cypress/vite-dev-server')

        module.exports = {
          component: {
            devServer,
            devServerConfig: {
              // optionally provide your Vite config overrides.
            }
          }
        }`
      }

      throw Error(`No config defined for ${bundler}`)
    },

    ts: (bundler: Bundler) => {
      if (isWebpack(bundler)) {
        return dedent`
        import { defineConfig } from 'cypress'
        import { devServer } from '@cypress/webpack-dev-server'
        import webpackConfig from '@vue/cli-service/webpack.config'

        export default defineConfig({
          component: {
            devServer,
            devServerConfig: {
              webpackConfig
            }
          }
        })`
      }

      if (bundler === 'vite') {
        return dedent`
        import { defineConfig } from 'cypress'
        import { devServer } from '@cypress/vite-dev-server'

        export default defineConfig({
          component: {
            devServer,
              // optionally provide your Vite config overrides.
            devServerConfig: {}
          }
        })`
      }

      throw Error(`No config defined for ${bundler}`)
    },
  },
} as const
