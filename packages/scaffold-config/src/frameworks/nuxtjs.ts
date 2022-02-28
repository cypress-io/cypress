import dedent from 'dedent'
import { BUNDLER_WEBPACK_4, CODE_GEN_FRAMEWORKS, CYPRESS_VUE_2, FRONTEND_FRAMEWORK_CATEGORIES } from '../constants'

export const nuxtjs = {
  type: 'nuxtjs',
  name: 'Nuxt.js (v2)',
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
      dependency: 'nuxt',
      version: '^2.0.0',
    },
  ],
  category: FRONTEND_FRAMEWORK_CATEGORIES[1],
  codeGenFramework: CODE_GEN_FRAMEWORKS[1],
  storybookDep: null,
  config: {
    js: () => {
      return dedent`
      const { defineConfig } = require("cypress")
      const { devServer } = require("@cypress/webpack-dev-server")
      const { getWebpackConfig } = require("nuxt")

      module.exports = defineConfig({
        component: {
          async devServer(cypressDevServerConfig) {
            const webpackConfig = await getWebpackConfig()

            return devServer(cypressDevServerConfig, { webpackConfig })
          }
        }
      })`
    },
    ts: () => {
      return dedent`
      import { defineConfig } from "cypress"
      import { devServer } from "@cypress/webpack-dev-server"
      import { getWebpackConfig } from "nuxt"

      export default defineConfig({
        component: {
          async devServer(cypressDevServerConfig) {
            const webpackConfig = await getWebpackConfig()

            return devServer(cypressDevServerConfig, { webpackConfig })
          }
        }
      })`
    },
  },
} as const
