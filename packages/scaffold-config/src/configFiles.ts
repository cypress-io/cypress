// import type { FRONTEND_FRAMEWORKS } from '@packages/types'
import path from 'path'
import fs from 'fs-extra'
import dedent from 'dedent'
import { satisfies } from 'compare-versions'

export const STORYBOOK_DEPS = [
  '@storybook/testing-react',
  '@storybook/testing-vue3',
] as const

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

  for (const framework of frontendFrameworks) {
    const hasAllDeps = framework.detectors.every(x => {
      const vers = pkg.dependencies?.[x.dependency] || pkg.devDependencies?.[x.dependency]
      return (vers && satisfies(vers, x.version)) ?? false

    })

    if (hasAllDeps) {
      return framework
    }
  }

  return undefined
}

export const frontendFrameworkPresets = [
  {
    id: 'vuecli4-vue2',
    group: 'vuecli',
    library: 'vue',
    type: 'preset',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: '@vue/cli-service',
        version: '^4.0.0',
      },
      {
        dependency: 'vue',
        version: '^2.0.0'
      }
    ],
  },

  {
    group: 'vuecli',
    id: 'vuecli4-vue3',
    type: 'preset',
    library: 'vue',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: '@vue/cli-service',
        version: '^4.0.0',
      },
      {
        dependency: 'vue',
        version: '^3.0.0'
      }
    ],
  },

  {
    id: 'vuecli5-vue2',
    group: 'vuecli',
    library: 'vue',
    type: 'preset',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: '@vue/cli-service',
        version: '^5.0.0',
      },
      {
        dependency: 'vue',
        version: '^2.0.0'
      }
    ],
  },

  {
    id: 'vuecli5-vue3',
    group: 'vuecli',
    type: 'preset',
    library: 'vue',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: '@vue/cli-service',
        version: '^5.0.0',
      },
      {
        dependency: 'vue',
        version: '^3.0.0'
      }
    ],
  },

  {
    id: 'nextjs',
    group: 'nextjs',
    type: 'preset',
    library: 'react',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: 'next',
        version: '>=11.0.0',
      },
    ],
  },

  {
    id: 'create-react-app',
    group: 'create-react-app',
    type: 'preset',
    library: 'react',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: 'react-scripts',
        version: '^4.0.0',
      },
    ],
  },

  {
    id: 'nuxt-2',
    group: 'nuxt',
    type: 'preset',
    library: 'vue',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: 'nuxt',
        version: '^2.0.0',
      },
    ],
  },
]

export const frontendFrameworkWithBundler = [
  {
    id: 'react-vite',
    group: 'react-vite',
    type: 'library-and-bundler',
    library: 'react',
    supportedBundlers: ['vite'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: 'react',
        version: '>=16.0.0'
      },
      { 
        dependency: 'react-dom',
        version: '>=16.0.0'
      },
      { 
        dependency: 'vite',
        version: '^2.0.0',
      },
    ],
  },

  {
    id: 'vue3-vite',
    group: 'vue-vite',
    type: 'library-and-bundler',
    library: 'vue',
    supportedBundlers: ['vite'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: 'vue',
        version: '>=3.0.0'
      },
      { 
        dependency: 'vite',
        version: '^2.0.0',
      },
    ],
  },
]

export const frontendFrameworkWithoutBundler = [
  {
    id: 'react',
    group: 'react',
    type: 'library',
    library: 'react',
    supportedBundlers: ['vite', 'webpack'],
    glob: '{*.js,*.jsx,*.ts,*.tsx}',
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
  },
  {
    id: 'vue2',
    group: 'vue',
    type: 'library',
    library: 'vue',
    supportedBundlers: ['vite', 'webpack'],
    glob: '{*.vue,*.jsx,*.tsx}',
    detectors: [
      { 
        dependency: 'vue',
        version: '^2.0.0'
      },
    ],
  },
  {
    id: 'vue3',
    group: 'vue',
    type: 'library',
    library: 'vue',
    supportedBundlers: ['vite', 'webpack'],
    glob: '{*.vue,*.jsx,*.tsx}',
    detectors: [
      { 
        dependency: 'vue',
        version: '^3.0.0'
      },
    ],
  },
]

export const frontendFrameworks = [
  ...frontendFrameworkPresets,
  ...frontendFrameworkWithBundler,
  ...frontendFrameworkWithoutBundler,
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