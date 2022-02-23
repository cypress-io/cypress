import dedent from 'dedent'
import { satisfies } from 'compare-versions'
import type { Bundler, PkgJson, FrontendFramework } from './types'
import {
  CODE_GEN_FRAMEWORKS,
  FRONTEND_FRAMEWORK_CATEGORIES,
  CYPRESS_REACT_LATEST,
  CYPRESS_VUE_2,
  CYPRESS_VUE_3,
  HTML_WEBPACK_PLUGIN_4,
  STORYBOOK_REACT,
  STORYBOOK_VUE,
  WEBPACK_DEV_SERVER_4,
} from './constants'

interface DetectFramework {
  framework?: FrontendFramework
  bundler?: Bundler['type']
}

const bundlers = [
  {
    type: 'vite',
    detectors: [
      {
        dependency: 'vite',
        version: '>=2.0.0',
      },
    ],
  },
  {
    type: 'webpack',
    detectors: [
      {
        dependency: 'webpack',
        version: '>=4.0.0',
      },
    ],
  },
] as const

interface Detector {
  version: string
  dependency: string
}

// Detect the framework, which can either be a tool like Create React App,
// in which case we just return the framework. The user cannot change the
// bundler.

// If we don't find a specific framework, but we do find a library and/or
// bunlder, we return both the framework, which might just be "React",
// and the bundler, which could be Vite.
export function detect (pkg: PkgJson): DetectFramework {
  const inPkgJson = (detector: Detector) => {
    const vers = pkg.dependencies?.[detector.dependency] || pkg.devDependencies?.[detector.dependency]
    const found = (vers && satisfies(vers, detector.version)) ?? false

    return found
  }

  // first see if it's a template
  for (const framework of FRONTEND_FRAMEWORKS.filter((x) => x.family === 'template')) {
    const hasAllDeps = [...framework.detectors].every(inPkgJson)

    // so far all the templates we support only have 1 bundler,
    // for example CRA only works with webpack,
    // but we want to consider in the future, tools like Nuxt ship
    // both a webpack and vite dev-env.
    // if we support this, we will also need to attempt to infer the dev server of choice.
    if (hasAllDeps && framework.supportedBundlers.length === 1) {
      return {
        framework,
      }
    }
  }

  // if not a template, they probably just installed/configured on their own.
  for (const library of FRONTEND_FRAMEWORKS.filter((x) => x.family === 'library')) {
    // multiple bundlers supported, eg React works with webpack and Vite.
    // try to infer which one they are using.
    const hasLibrary = [...library.detectors].every(inPkgJson)

    for (const bundler of bundlers) {
      const hasBundler = [...bundler.detectors].every(inPkgJson)

      if (hasLibrary && hasBundler) {
        return {
          framework: library,
          bundler: bundler.type,
        }
      }

      if (hasLibrary) {
        // unknown bundler, or we couldn't detect it
        // just return the framework, leave the rest to the user.
        return {
          framework: library,
        }
      }
    }
  }

  return {
    framework: undefined,
    bundler: undefined,
  }
}

export const FRONTEND_FRAMEWORKS = [
  {
    type: 'cra',
    family: 'template',
    name: 'Create React App',
    supportedBundlers: ['webpack'],
    packages: [CYPRESS_REACT_LATEST],
    defaultPackagePath: '@cypress/react/plugins/react-scripts',
    glob: '*.{jsx,tsx}',
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_REACT,
    detectors: [
      {
        dependency: 'react-scripts',
        version: '>=4.0.0',
      },
    ],
    config: {
      js: () => {
        return dedent`
      const { devServer } = require('@cypress/react/plugins/react-scripts')

      module.exports = {
        component: {
          devServer,
        }
      }`
      },
      ts: () => {
        return dedent`
      import { defineConfig } from 'cypress'
      import { devServer } from '@cypress/react/plugins/react-scripts'

      export default defineConfig({
        component: {
          devServer,
        }
      })`
      },
    },
  },
  {
    type: 'vueclivue2',
    name: 'Vue CLI (Vue 2)',
    family: 'template',
    supportedBundlers: ['webpack'],
    packages: [CYPRESS_VUE_2],
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
    family: 'template',
    supportedBundlers: ['webpack'],
    packages: [CYPRESS_VUE_3],
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
    type: 'react',
    name: 'React.js',
    family: 'library',
    supportedBundlers: ['webpack', 'vite'],
    packages: [CYPRESS_REACT_LATEST],
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
    storybookDep: STORYBOOK_REACT,
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
  },

  {
    type: 'vue2',
    name: 'Vue.js (v2)',
    family: 'library',
    supportedBundlers: ['webpack', 'vite'],
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
    family: 'library',
    supportedBundlers: ['webpack', 'vite'],
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
    type: 'nextjs',
    name: 'Next.js',
    family: 'template',
    supportedBundlers: ['webpack'],
    packages: [
      CYPRESS_REACT_LATEST,
      WEBPACK_DEV_SERVER_4,
      HTML_WEBPACK_PLUGIN_4,
    ],
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
    supportedBundlers: ['webpack'],
    packages: [
      CYPRESS_VUE_2,
      HTML_WEBPACK_PLUGIN_4,
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
  },
] as const
