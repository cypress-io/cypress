import dedent from 'dedent'
import type { Bundler } from '../types'
import { BUNDLER_VITE, BUNDLER_WEBPACK_4, BUNDLER_WEBPACK_5, CODE_GEN_FRAMEWORKS, CYPRESS_REACT_LATEST, FRONTEND_FRAMEWORK_CATEGORIES, STORYBOOK_REACT } from '../constants'
import { isWebpack } from './isWebpack'

export const react = {
  type: 'react',
  name: 'React.js',
  family: 'library',
  supportedBundlers: [BUNDLER_WEBPACK_4, BUNDLER_WEBPACK_5, BUNDLER_VITE],
  packages: [CYPRESS_REACT_LATEST],
  defaultPackagePath: null,
  glob: '*.{js,jsx,tsx}',
  detectors: [
    {
      dependency: 'react',
      version: '>=16.0.0',
    },
    {
      dependency: 'react-dom',
      version: '>=16.0.0',
    },
  ],
  category: FRONTEND_FRAMEWORK_CATEGORIES[0],
  codeGenFramework: CODE_GEN_FRAMEWORKS[0],
  storybookDep: STORYBOOK_REACT,
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
        // NOTE: ensure you are requiring your webpack config from the
        // correct location.
        import webpackConfig from './webpack.config.js'

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
