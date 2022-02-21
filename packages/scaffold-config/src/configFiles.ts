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
export async function detect (dir: string) {
  for (const framework of frontendFrameworks) {
    const pkg = await fs.readJson(path.join(`${dir}`, 'package.json'))
    const hasAllDeps = framework.detectors.every(x => {
      const vers = pkg.dependencies?.[x.dependency] || pkg.devDependencies?.[x.dependency]
      return (vers && satisfies(vers, x.version)) ?? false

    })

    if (hasAllDeps) {
      return framework
    }
  }
}

export const frontendFrameworks = [
  {
    id: 'vuecli4-vue2',
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
    id: 'vuecli4-vue3',
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
        version: '^3.0.0'
      }
    ],
  },

  {
    id: 'vuecli5-vue2',
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
        version: '^3.0.0'
      }
    ],
  },

  {
    id: 'nextjs',
    type: 'preset',
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
    type: 'preset',
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
    id: 'react-vite',
    type: 'library-and-bundler',
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
    type: 'library-and-bundler',
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

  {
    id: 'nuxt-2',
    type: 'preset',
    supportedBundlers: ['webpack'],
    glob: '*.{js,jsx,tsx}',
    detectors: [
      { 
        dependency: 'nuxt',
        version: '^2.0.0',
      },
    ],
  },

  // {
  //   type: 'vuecli',
  //   name: 'Vue CLI v4',
  //   supportedBundlers: ['webpack'],
  //   package: '@cypress/vue',
  //   defaultPackagePath: null,
  //   detectors: [
  //     {
  //       path: 'package.json',
  //       matchContent:
  //         '"(dev)?(d|D)ependencies":\\s*{[^}]*"@vue\\/cli-service":\\s*".+?"[^}]*}',
  //     },
  //   ],
  //   glob: '*.vue',
  //   deps: ['@vue/cli-service', 'vue'],
  //   category: FRONTEND_FRAMEWORK_CATEGORIES[1],
  // },
  // {
  //   type: 'react',
  //   name: 'React.js',
  //   supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
  //   package: '@cypress/react',
  //   defaultPackagePath: null,
  //   glob: '*.{jsx,tsx}',
  //   deps: ['react', 'react-dom'],
  //   category: FRONTEND_FRAMEWORK_CATEGORIES[0],
  //   storybookDep: 
  // },
  // {
  //   type: 'vue',
  //   name: 'Vue.js',
  //   supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
  //   package: '@cypress/vue',
  //   defaultPackagePath: null,
  //   glob: '*.vue',
  //   deps: ['vue'],
  //   category: FRONTEND_FRAMEWORK_CATEGORIES[1],
  //   storybookDep: STORYBOOK_DEPS[1],
  // },
  // {
  //   type: 'nextjs',
  //   name: 'Next.js',
  //   supportedBundlers: ['webpack'] as readonly Bundler['type'][],
  //   package: '@cypress/react',
  //   defaultPackagePath: '@cypress/react/plugins/next',
  //   glob: '*.{jsx,tsx}',
  //   deps: ['next', 'react', 'react-dom'],
  //   category: FRONTEND_FRAMEWORK_CATEGORIES[0],
  //   storybookDep: STORYBOOK_DEPS[0],
  // },
  // {
  //   type: 'nuxtjs',
  //   name: 'Nuxt.js',
  //   supportedBundlers: ['webpack'] as readonly Bundler['type'][],
  //   package: '@cypress/vue',
  //   defaultPackagePath: null,
  //   glob: '*.vue',
  //   deps: ['nuxt'],
  //   category: FRONTEND_FRAMEWORK_CATEGORIES[1],
  //   storybookDep: STORYBOOK_DEPS[1],
  // },
]

type FrameworkType = typeof FRONTEND_FRAMEWORKS[number]['type']
type Lang = `${'j'|'t'}s`

type ConfigMap = {
  [key in FrameworkType]: {
    [key in Lang]: string
  }
}

const frameworks = [
  {
    name: 'cra',

  }
]

export const configFiles: ConfigMap = {
  cra: {
    js: dedent`
      const { defineConfig } = require('cypress')
      const { devServer } = require('@cypress/react/plugins/react-scripts')

      module.exports = defineConfig({
        'video': false,
        'viewportWidth': 500,
        'viewportHeight': 800,
        'experimentalFetchPolyfill': true,
        'component': {
          devServer,
        },
      })
  `,
  ts: dedent`
    import { defineConfig } from 'cypress'
    import { devServer } from '@cypress/react/plugins/react-scripts'

    export default defineConfig({
      component: {
        devServer,
      },
    })
  `
  },

  nextjs: {
    js: dedent`
    const { devServer } = require('@cypress/react/plugins/next')

    module.exports = {
      component: {
        devServer
      }
    }
    `,
    ts: dedent`
    import { defineConfig } from 'cypress'
    import { devServer } from '@cypress/react/plugins/next'

    export default defineConfig({
      component: {
        devServer,
      },
    })`
  },

  vuecli: {
    js: dedent`
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
    `,
    ts: dedent`
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

  nuxtjs: {
    js: dedent`
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
    })
    `,
    ts: dedent`
    `
  }
}