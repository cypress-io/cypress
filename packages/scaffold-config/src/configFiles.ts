import path from 'path'
import fs from 'fs-extra'
import dedent from 'dedent'
import { satisfies } from 'compare-versions'
import type { Bundler } from './types'
import { CODE_GEN_FRAMEWORKS, FRONTEND_FRAMEWORK_CATEGORIES, STORYBOOK_DEPS } from './constants'

/**
 * We need to detect a few things:
 *
 * 1. Version of Library (Vue, React...)
 *
 * This is required. You cannot configure component testing without a component library.
 *
 * 2. Dev Server.
 *
 * Are we using Webpack, Vite etc?
 *
 * 3. Tool (eg Create React App, Vue CLI)
 *   3.1 Version of the tool
 *
 * This is optional. It includes tools like Vue CLI, Create React App, etc.
 *
 * If no library is detected, we cannot progress.
 * If a library is detected but no tool or dev server, let the user select.
 *
 * Onc we know the library, dev server and (optional) tool, we can generate a config file
 * and instruct the user which dependencies to install.
 */
export function detect (dir: string) {
  const pkg = fs.readJsonSync(path.join(`${dir}`, 'package.json'))

  for (const framework of FRONTEND_FRAMEWORKS) {
    const hasAllDeps = [...framework.detectors].every((x) => {
      const vers = pkg.dependencies?.[x.dependency] || pkg.devDependencies?.[x.dependency]

      return (vers && satisfies(vers, x.version)) ?? false
    })

    if (hasAllDeps) {
      return framework
    }
  }

  return undefined
}

export const FRONTEND_FRAMEWORKS = [
  {
    type: 'cra',
    name: 'Create React App',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/react',
      version: 'latest',
      installer: '@cypress/react@^5.0.0',
    },
    defaultPackagePath: '@cypress/react/plugins/react-scripts',
    glob: '*.{jsx,tsx}',
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_DEPS[0],
    detectors: [
      {
        dependency: 'react-scripts',
        version: '>=4.0.0',
      },
    ],
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },
  {
    type: 'vueclivue2',
    name: 'Vue CLI (Vue 2)',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/vue',
      version: '^2.0.0',
      installer: '@cypress/vue@^2.0.0',
    },
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
    storybookDep: STORYBOOK_DEPS[1],
    config: {
      js: (bundler: Bundler['type']) => {
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
  },
  {
    type: 'vueclivue3',
    name: 'Vue CLI (Vue 3)',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/vue',
      version: '^3.0.0',
      installer: '@cypress/vue@^3.0.0',
    },
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
    storybookDep: STORYBOOK_DEPS[1],
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },
  {
    type: 'react',
    name: 'React.js',
    supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/react',
      version: 'latest',
      installer: '@cypress/react@^5.0.0',
    },
    defaultPackagePath: null,
    glob: '*.{jsx,tsx}',
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
    storybookDep: STORYBOOK_DEPS[0],
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },

  {
    type: 'vue2',
    name: 'Vue.js (v2)',
    supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/vue',
      version: '^2.0.0',
      installer: '@cypress/vue@^2.0.0',
    },
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
    storybookDep: STORYBOOK_DEPS[1],
    config: {
      js: (bundler: Bundler['type']) => {
        if (bundler === 'webpack') {
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

      ts: (bundler: Bundler['type']) => {
        if (bundler === 'webpack') {
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
  },

  {
    type: 'vue3',
    name: 'Vue.js (v3)',
    supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/vue',
      version: '^3.0.0',
      installer: '@cypress/vue@^3.0.0',
    },
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
    storybookDep: STORYBOOK_DEPS[1],
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },
  {
    type: 'nextjs',
    name: 'Next.js',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/react',
      version: 'latest',
      installer: '@cypress/react@^5.0.0',
    },
    defaultPackagePath: '@cypress/react/plugins/next',
    glob: '*.{jsx,tsx}',
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    detectors: [
      {
        dependency: 'next',
        version: '>=11.0.0',
      },
    ],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_DEPS[0],
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },
  {
    type: 'nuxtjs',
    name: 'Nuxt.js (v2)',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    package: {
      name: '@cypress/vue',
      version: '^2.0.0',
      installer: '@cypress/vue@^2.0.0',
    },
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
    storybookDep: STORYBOOK_DEPS[1],
    config: {
      js: () => ``,
      ts: () => ``,
    },
  },
] as const

export const configFiles = {}

// export const configFiles: ConfigMap = {
//   cra: {
//     js: dedent`
//       const { defineConfig } = require('cypress')
//       const { devServer } = require('@cypress/react/plugins/react-scripts')

//       module.exports = defineConfig({
//         'video': false,
//         'viewportWidth': 500,
//         'viewportHeight': 800,
//         'experimentalFetchPolyfill': true,
//         'component': {
//           devServer,
//         },
//       })
//   `,
//   ts: dedent`
//     import { defineConfig } from 'cypress'
//     import { devServer } from '@cypress/react/plugins/react-scripts'

//     export default defineConfig({
//       component: {
//         devServer,
//       },
//     })
//   `
//   },

//   nextjs: {
//     js: dedent`
//     const { devServer } = require('@cypress/react/plugins/next')

//     module.exports = {
//       component: {
//         devServer
//       }
//     }
//     `,
//     ts: dedent`
//     import { defineConfig } from 'cypress'
//     import { devServer } from '@cypress/react/plugins/next'

//     export default defineConfig({
//       component: {
//         devServer,
//       },
//     })`
//   },

//   vuecli: {
//     js: dedent`
//     const { devServer } = require('@cypress/webpack-dev-server')
//     const webpackConfig = require('@vue/cli-service/webpack.config')

//     module.exports = {
//       component: {
//         devServer,
//         devServerConfig: {
//           webpackConfig
//         }
//       }
//     }
//     `,
//     ts: dedent`
//     import { defineConfig } from 'cypress'
//     import { devServer } from '@cypress/webpack-dev-server'
//     import webpackConfig from '@vue/cli-service/webpack.config'

//     export default defineConfig({
//       component: {
//         devServer,
//         devServerConfig: {
//           webpackConfig
//         }
//       }
//     })`
//   },

//   nuxtjs: {
//     js: dedent`
//     const { defineConfig } = require("cypress")
//     const { devServer } = require("@cypress/webpack-dev-server")
//     const { getWebpackConfig } = require("nuxt")

//     module.exports = defineConfig({
//       component: {
//         async devServer(cypressDevServerConfig) {
//           const webpackConfig = await getWebpackConfig()

//           return devServer(cypressDevServerConfig, { webpackConfig })
//         }
//       }
//     })
//     `,
//     ts: dedent`
//     `
//   }
// }
