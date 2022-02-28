import dedent from 'dedent'
import type { Bundler } from '../types'
import { BUNDLER_WEBPACK_4, CODE_GEN_FRAMEWORKS, CYPRESS_VUE_2, FRONTEND_FRAMEWORK_CATEGORIES, STORYBOOK_VUE } from '../constants'

export const vueclivue2 = {
  type: 'vueclivue2',
  name: 'Vue CLI (Vue 2)',
  family: 'template',
  supportedBundlers: [BUNDLER_WEBPACK_4],
  packages: [
    CYPRESS_VUE_2,
    BUNDLER_WEBPACK_4,
  ],
  defaultPackagePath: null,
  glob: '*.vue',
  detectors: [
    {
      dependency: '@vue/cli-service',
      version: '^4.0.0',
    },
    {
      dependency: 'vue',
      version: '^2.0.0',
    },
  ],
  category: FRONTEND_FRAMEWORK_CATEGORIES[1],
  codeGenFramework: CODE_GEN_FRAMEWORKS[1],
  storybookDep: STORYBOOK_VUE,
  config: {
    js: (bundler: Bundler) => {
      return dedent`
    const { devServer } = require('@cypress/webpack-dev-server')
    const webpackConfig = require('@vue/cli-service/webpack.config')

    module.exports = {
      component: {
        devServer,
        devServerConfig: {
          webpackConfig
        }
      }
    }
    `
    },
    ts: () => {
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
    },
  },
} as const
