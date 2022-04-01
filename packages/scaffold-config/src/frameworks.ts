import dedent from 'dedent'
import type { Bundler } from './types'
import {
  CODE_GEN_FRAMEWORKS,
  FRONTEND_FRAMEWORK_CATEGORIES,
  CYPRESS_REACT_LATEST,
  CYPRESS_VUE_2,
  CYPRESS_VUE_3,
  STORYBOOK_REACT,
  STORYBOOK_VUE,
  BUNDLER_WEBPACK_4,
} from './constants'
import { BUNDLER_VITE, BUNDLER_WEBPACK_5 } from '.'

const isWebpack = (bundler: Bundler) => ['webpack4', 'webpack5'].includes(bundler)

export const FRONTEND_FRAMEWORKS = [
  {
    type: 'crav4',
    family: 'template',
    name: 'Create React App (v4)',
    supportedBundlers: [BUNDLER_WEBPACK_4],
    packages: [
      CYPRESS_REACT_LATEST,
      BUNDLER_WEBPACK_4,
    ],
    defaultPackagePath: '@cypress/react/plugins/react-scripts',
    glob: '*.{js,jsx,tsx}',
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_REACT,
    detectors: [
      {
        dependency: 'react-scripts',
        version: '^4.0.0',
      },
    ],
    config: {
      js: () => {
        return dedent`
      const { devServer } = require('@cypress/react/plugins/react-scripts')

      module.exports = {
        component: {
          devServer,
        },
      }`
      },
      ts: () => {
        return dedent`
      import { defineConfig } from 'cypress'
      import { devServer } from '@cypress/react/plugins/react-scripts'

      export default defineConfig({
        component: {
          devServer,
        },
      })`
      },
    },
  },
  {
    type: 'crav5',
    family: 'template',
    name: 'Create React App (v5)',
    supportedBundlers: [BUNDLER_WEBPACK_5],
    packages: [
      CYPRESS_REACT_LATEST,
      BUNDLER_WEBPACK_5,
    ],
    defaultPackagePath: '@cypress/react/plugins/react-scripts',
    glob: '*.{js,jsx,tsx}',
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_REACT,
    detectors: [
      {
        dependency: 'react-scripts',
        version: '^5.0.0',
      },
    ],
    config: {
      js: () => {
        return dedent`
      const { devServer } = require('@cypress/react/plugins/react-scripts')

      module.exports = {
        component: {
          devServer,
        },
      }`
      },
      ts: () => {
        return dedent`
      import { defineConfig } from 'cypress'
      import { devServer } from '@cypress/react/plugins/react-scripts'

      export default defineConfig({
        component: {
          devServer,
        },
      })`
      },
    },
  },
  {
    type: 'vuecli4vue2',
    name: 'Vue CLI 4 (Vue 2)',
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
            webpackConfig,
          },
        },
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
            webpackConfig,
          },
        },
      })`
      },
    },
  },
  {
    type: 'vuecli4vue3',
    name: 'Vue CLI 4 (Vue 3)',
    family: 'template',
    supportedBundlers: [BUNDLER_WEBPACK_4],
    packages: [
      CYPRESS_VUE_3,
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
        version: '^3.0.0',
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
            webpackConfig,
          },
        },
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
            webpackConfig,
          },
        },
      })`
      },
    },
  },
  {
    type: 'vuecli5vue2',
    name: 'Vue CLI 5 (Vue 2)',
    family: 'template',
    supportedBundlers: [BUNDLER_WEBPACK_5],
    packages: [
      CYPRESS_VUE_2,
      BUNDLER_WEBPACK_5,
    ],
    defaultPackagePath: null,
    glob: '*.vue',
    detectors: [
      {
        dependency: '@vue/cli-service',
        version: '^5.0.0',
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
            webpackConfig,
          },
        },
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
            webpackConfig,
          },
        },
      })`
      },
    },
  },
  {
    type: 'vuecli5vue3',
    name: 'Vue CLI 5 (Vue 3)',
    family: 'template',
    supportedBundlers: [BUNDLER_WEBPACK_5],
    packages: [
      CYPRESS_VUE_3,
      BUNDLER_WEBPACK_5,
    ],
    defaultPackagePath: null,
    glob: '*.vue',
    detectors: [
      {
        dependency: '@vue/cli-service',
        version: '^5.0.0',
      },
      {
        dependency: 'vue',
        version: '^3.0.0',
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
            webpackConfig,
          },
        },
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
            webpackConfig,
          },
        },
      })`
      },
    },
  },
  {
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
                webpackConfig,
              },
            },
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
              },
            },
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
                webpackConfig,
              },
            },
          })`
        }

        if (bundler === 'vite') {
          return dedent`
          import { defineConfig } from 'cypress'
          import { devServer } from '@cypress/vite-dev-server'

          export default defineConfig({
            component: {
              devServer,
              devServerConfig: {
                // optionally provide your Vite config overrides.
              },
            },
          })`
        }

        throw Error(`No config defined for ${bundler}`)
      },
    },
  },

  {
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
                webpackConfig,
              },
            },
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
              },
            },
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
                webpackConfig,
              },
            },
          })`
        }

        if (bundler === 'vite') {
          return dedent`
          import { defineConfig } from 'cypress'
          import { devServer } from '@cypress/vite-dev-server'

          export default defineConfig({
            component: {
              devServer,
              devServerConfig: {
                // optionally provide your Vite config overrides.
              },
            },
          })`
        }

        throw Error(`No config defined for ${bundler}`)
      },
    },
  },

  {
    type: 'vue3',
    name: 'Vue.js (v3)',
    family: 'library',
    supportedBundlers: [BUNDLER_WEBPACK_4, BUNDLER_WEBPACK_5, BUNDLER_VITE],
    packages: [CYPRESS_VUE_3],
    defaultPackagePath: null,
    glob: '*.vue',
    detectors: [
      {
        dependency: 'vue',
        version: '^3.0.0',
      },
    ],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: STORYBOOK_VUE,
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
                webpackConfig,
              },
            },
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
              },
            },
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
                webpackConfig,
              },
            },
          })`
        }

        if (bundler === 'vite') {
          return dedent`
          import { defineConfig } from 'cypress'
          import { devServer } from '@cypress/vite-dev-server'

          export default defineConfig({
            component: {
              devServer,
              devServerConfig: {
                // optionally provide your Vite config overrides.
              },
            },
          })`
        }

        throw Error(`No config defined for ${bundler}`)
      },
    },
  },
  {
    type: 'nextjs',
    name: 'Next.js',
    family: 'template',
    supportedBundlers: [BUNDLER_WEBPACK_4],
    packages: [
      CYPRESS_REACT_LATEST,
      BUNDLER_WEBPACK_4,
    ],
    defaultPackagePath: '@cypress/react/plugins/next',
    glob: '*.{js,jsx,tsx}',
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    detectors: [
      {
        dependency: 'next',
        version: '>=10.0.0',
      },
    ],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_REACT,
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },
  {
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
            async devServer(cypressDevServerConfig, devServerConfig) {
              const webpackConfig = await getWebpackConfig()

              return devServer(cypressDevServerConfig, { webpackConfig, ...devServerConfig })
            },
          },
        })`
      },
      ts: () => {
        return dedent`
        import { defineConfig } from "cypress"
        import { devServer } from "@cypress/webpack-dev-server"
        import { getWebpackConfig } from "nuxt"

        export default defineConfig({
          component: {
            async devServer(cypressDevServerConfig, devServerConfig) {
              const webpackConfig = await getWebpackConfig()

              return devServer(cypressDevServerConfig, { webpackConfig, ...devServerConfig })
            },
          },
        })`
      },
    },
  },
] as const
