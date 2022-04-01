import path from 'path'
import fs from 'fs-extra'
import * as dependencies from './dependencies'
import { satisfies } from 'semver'
import resolveFrom from 'resolve-from'

type PkgJson = { version: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }

const WIZARD_BUNDLER_WEBPACK = {
  type: 'webpack',
  name: 'Webpack'
} as const

const WIZARD_BUNDLER_VITE = {
  type: 'vite',
  name: 'Vite'
} as const

export const WIZARD_BUNDLERS = [
  WIZARD_BUNDLER_VITE,
  WIZARD_BUNDLER_WEBPACK
] as const

type WizardBundler = typeof WIZARD_BUNDLERS[number]['type']

export type WizardDependency = typeof dependencies.WIZARD_DEPENDENCIES[number]

export interface DependencyToInstall {
  dependency: WizardDependency
  satisfied: boolean
  loc: string | null
  detectedVersion: string | null
}

export function inPkgJson (dependency: WizardDependency, projectPath: string): DependencyToInstall {
  try {
    const loc = resolveFrom(projectPath, path.join(dependency.package, 'package.json'))
    const pkg = fs.readJsonSync(loc) as PkgJson
    return {
      dependency,
      detectedVersion: pkg.version,
      loc,
      satisfied: Boolean(pkg.version && satisfies(pkg.version, dependency.minVersion))
    }
  } catch (e) { 
    return {
      dependency,
      detectedVersion: null,
      loc: null,
      satisfied: false
    }
  }
}

function getBundlerDependency (bundler: WizardBundler, projectPath: string): DependencyToInstall {
  switch (bundler) {
    case 'vite': return inPkgJson(dependencies.WIZARD_DEPENDENCY_VITE, projectPath)
    case 'webpack': return inPkgJson(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath)
    default: throw Error(`Unknown bundler ${bundler}`)
  }
}

export const WIZARD_FRAMEWORKS = [
  {
    type: 'reactscripts',
    family: 'template',
    name: 'Create React App',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_REACT,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => [
      inPkgJson(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath),
      inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
    ],
  },
  {
    type: 'vueclivue2',
    family: 'template',
    name: 'Vue CLI (Vue 2)',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_VUE_2,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => [
      inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
      inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
    ],
  },
  {
    type: 'vueclivue3',
    family: 'template',
    name: 'Vue CLI (Vue 3)',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_VUE_3,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => [
      inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
      inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
    ],
  },
  {
    type: 'nextjs',
    family: 'template',
    name: 'Next.js',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_REACT,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => [
      inPkgJson(dependencies.WIZARD_DEPENDENCY_NEXT, projectPath),
      inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
    ],
  },
  {
    type: 'nuxtjs',
    family: 'template',
    name: 'Nuxt.js',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_VUE_2,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => [
      inPkgJson(dependencies.WIZARD_DEPENDENCY_NUXT, projectPath),
      inPkgJson(dependencies.WIZARD_DEPENDENCY_NUXT, projectPath),
    ],
  },
  {
    type: 'vue2',
    family: 'library',
    name: 'Vue.js 2',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK, WIZARD_BUNDLER_VITE],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_VUE_2,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ]
    },
  },
  {
    type: 'vue3',
    family: 'library',
    name: 'Vue.js 3',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK, WIZARD_BUNDLER_VITE],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_VUE_3,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        getBundlerDependency(bundler, projectPath), 
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ]
    },
  },
  {
    type: 'react',
    family: 'library',
    name: 'React.js',
    supportedBundlers: [WIZARD_BUNDLER_WEBPACK, WIZARD_BUNDLER_VITE],
    storybookDep: dependencies.WIZARD_DEPENDENCY_STORYBOOK_REACT,
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        getBundlerDependency(bundler, projectPath), 
        inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
      ]
    },
  },
] as const 

// export type WizardFramework = typeof WIZARD_FRAMEWORKS[number]

// export const FRONTEND_FRAMEWORKS = [
//   {
//     type: 'crav4',
//     family: 'template',
//     name: 'Create React App (v4)',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_REACT_LATEST,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: '@cypress/react/plugins/react-scripts',
//     glob: '*.{js,jsx,tsx}',
//     category: FRONTEND_FRAMEWORK_CATEGORIES[0],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[0],
//     storybookDep: STORYBOOK_REACT,
//     detectors: [
//       {
//         dependency: 'react-scripts',
//         version: '^4.0.0',
//       },
//     ],
//     config: {
//       js: () => {
//         return dedent`
//       const { devServer } = require('@cypress/react/plugins/react-scripts')

//       module.exports = {
//         component: {
//           devServer,
//           devServerConfig: {
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       }`
//       },
//       ts: () => {
//         return dedent`
//       import { defineConfig } from 'cypress'
//       import { devServer } from '@cypress/react/plugins/react-scripts'

//       export default defineConfig({
//         component: {
//           devServer,
//           devServerConfig: {
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       })`
//       },
//     },
//   },
//   {
//     type: 'crav5',
//     family: 'template',
//     name: 'Create React App (v5)',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_REACT_LATEST,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: '@cypress/react/plugins/react-scripts',
//     glob: '*.{js,jsx,tsx}',
//     category: FRONTEND_FRAMEWORK_CATEGORIES[0],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[0],
//     storybookDep: STORYBOOK_REACT,
//     detectors: [
//       {
//         dependency: 'react-scripts',
//         version: '^5.0.0',
//       },
//     ],
//     config: {
//       js: () => {
//         return dedent`
//       const { devServer } = require('@cypress/react/plugins/react-scripts')

//       module.exports = {
//         component: {
//           devServer,
//           devServerConfig: {
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       }`
//       },
//       ts: () => {
//         return dedent`
//       import { defineConfig } from 'cypress'
//       import { devServer } from '@cypress/react/plugins/react-scripts'

//       export default defineConfig({
//         component: {
//           devServer,
//           devServerConfig: {
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       })`
//       },
//     },
//   },
//   {
//     type: 'vuecli4vue2',
//     name: 'Vue CLI 4 (Vue 2)',
//     family: 'template',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_VUE_2,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: '@vue/cli-service',
//         version: '^4.0.0',
//       },
//       {
//         dependency: 'vue',
//         version: '^2.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: STORYBOOK_VUE,
//     config: {
//       js: (bundler: Bundler) => {
//         return dedent`
//       const { devServer } = require('@cypress/webpack-dev-server')
//       const webpackConfig = require('@vue/cli-service/webpack.config')

//       module.exports = {
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       }
//       `
//       },
//       ts: () => {
//         return dedent`
//       import { defineConfig } from 'cypress'
//       import { devServer } from '@cypress/webpack-dev-server'
//       import webpackConfig from '@vue/cli-service/webpack.config'

//       export default defineConfig({
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       })`
//       },
//     },
//   },
//   {
//     type: 'vuecli4vue3',
//     name: 'Vue CLI 4 (Vue 3)',
//     family: 'template',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_VUE_3,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: '@vue/cli-service',
//         version: '^4.0.0',
//       },
//       {
//         dependency: 'vue',
//         version: '^3.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: STORYBOOK_VUE,
//     config: {
//       js: (bundler: Bundler) => {
//         return dedent`
//       const { devServer } = require('@cypress/webpack-dev-server')
//       const webpackConfig = require('@vue/cli-service/webpack.config')

//       module.exports = {
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       }
//       `
//       },
//       ts: () => {
//         return dedent`
//       import { defineConfig } from 'cypress'
//       import { devServer } from '@cypress/webpack-dev-server'
//       import webpackConfig from '@vue/cli-service/webpack.config'

//       export default defineConfig({
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       })`
//       },
//     },
//   },
//   {
//     type: 'vuecli5vue2',
//     name: 'Vue CLI 5 (Vue 2)',
//     family: 'template',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_VUE_2,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: '@vue/cli-service',
//         version: '^5.0.0',
//       },
//       {
//         dependency: 'vue',
//         version: '^2.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: STORYBOOK_VUE,
//     config: {
//       js: (bundler: Bundler) => {
//         return dedent`
//       const { devServer } = require('@cypress/webpack-dev-server')
//       const webpackConfig = require('@vue/cli-service/webpack.config')

//       module.exports = {
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       }
//       `
//       },
//       ts: () => {
//         return dedent`
//       import { defineConfig } from 'cypress'
//       import { devServer } from '@cypress/webpack-dev-server'
//       import webpackConfig from '@vue/cli-service/webpack.config'

//       export default defineConfig({
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       })`
//       },
//     },
//   },
//   {
//     type: 'vuecli5vue3',
//     name: 'Vue CLI 5 (Vue 3)',
//     family: 'template',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_VUE_3,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: '@vue/cli-service',
//         version: '^5.0.0',
//       },
//       {
//         dependency: 'vue',
//         version: '^3.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: STORYBOOK_VUE,
//     config: {
//       js: (bundler: Bundler) => {
//         return dedent`
//       const { devServer } = require('@cypress/webpack-dev-server')
//       const webpackConfig = require('@vue/cli-service/webpack.config')

//       module.exports = {
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       }
//       `
//       },
//       ts: () => {
//         return dedent`
//       import { defineConfig } from 'cypress'
//       import { devServer } from '@cypress/webpack-dev-server'
//       import webpackConfig from '@vue/cli-service/webpack.config'

//       export default defineConfig({
//         component: {
//           devServer,
//           devServerConfig: {
//             webpackConfig,
//             indexHtmlFile: 'cypress/support/component-index.html',
//           },
//         },
//       })`
//       },
//     },
//   },
//   {
//     type: 'react',
//     name: 'React.js',
//     family: 'library',
//     supportedBundlers: [BUNDLER_WEBPACK, BUNDLER_WEBPACK, BUNDLER_VITE],
//     packages: [CYPRESS_REACT_LATEST],
//     defaultPackagePath: null,
//     glob: '*.{js,jsx,tsx}',
//     detectors: [
//       {
//         dependency: 'react',
//         version: '>=16.0.0',
//       },
//       {
//         dependency: 'react-dom',
//         version: '>=16.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[0],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[0],
//     storybookDep: STORYBOOK_REACT,
//     config: {
//       js: (bundler: Bundler) => {
//         if (bundler === 'webpack') {
//           return dedent`
//           const { devServer } = require('@cypress/webpack-dev-server')
//           // NOTE: ensure you are requiring your webpack config from the
//           // correct location.
//           const webpackConfig = require('./webpack.config.js')

//           module.exports = {
//             component: {
//               devServer,
//               devServerConfig: {
//                 webpackConfig,
//                 indexHtmlFile: 'cypress/support/component-index.html',
//               },
//             },
//           }`
//         }

//         if (bundler === 'vite') {
//           return dedent`
//           const { devServer } = require('@cypress/vite-dev-server')

//           module.exports = {
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 // optionally provide your Vite config overrides.
//               },
//             },
//           }`
//         }

//         throw Error(`No config defined for ${bundler}`)
//       },

//       ts: (bundler: Bundler) => {
//         if (bundler === 'webpack') {
//           return dedent`
//           import { defineConfig } from 'cypress'
//           import { devServer } from '@cypress/webpack-dev-server'
//           // NOTE: ensure you are requiring your webpack config from the
//           // correct location.
//           import webpackConfig from './webpack.config.js'

//           export default defineConfig({
//             component: {
//               devServer,
//               devServerConfig: {
//                 webpackConfig,
//                 indexHtmlFile: 'cypress/support/component-index.html',
//               },
//             },
//           })`
//         }

//         if (bundler === 'vite') {
//           return dedent`
//           import { defineConfig } from 'cypress'
//           import { devServer } from '@cypress/vite-dev-server'

//           export default defineConfig({
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 // optionally provide your Vite config overrides.
//               },
//             },
//           })`
//         }

//         throw Error(`No config defined for ${bundler}`)
//       },
//     },
//   },

//   {
//     type: 'vue2',
//     name: 'Vue.js (v2)',
//     family: 'library',
//     supportedBundlers: [BUNDLER_WEBPACK, BUNDLER_WEBPACK, BUNDLER_VITE],
//     packages: [CYPRESS_VUE_2],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: 'vue',
//         version: '^2.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: null,
//     config: {
//       js: (bundler: Bundler) => {
//         if (bundler === 'webpack') {
//           return dedent`
//           const { devServer } = require('@cypress/webpack-dev-server')
//           // NOTE: ensure you are requiring your webpack config from the
//           // correct location.
//           const webpackConfig = require('./webpack.config.js')

//           module.exports = {
//             component: {
//               devServer,
//               devServerConfig: {
//                 webpackConfig,
//                 indexHtmlFile: 'cypress/support/component-index.html',
//               },
//             },
//           }`
//         }

//         if (bundler === 'vite') {
//           return dedent`
//           const { devServer } = require('@cypress/vite-dev-server')

//           module.exports = {
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 // optionally provide your Vite config overrides.
//               },
//             },
//           }`
//         }

//         throw Error(`No config defined for ${bundler}`)
//       },

//       ts: (bundler: Bundler) => {
//         if (bundler === 'webpack') {
//           return dedent`
//           import { defineConfig } from 'cypress'
//           import { devServer } from '@cypress/webpack-dev-server'
//           import webpackConfig from '@vue/cli-service/webpack.config'

//           export default defineConfig({
//             component: {
//               devServer,
//               devServerConfig: {
//                 webpackConfig,
//                 indexHtmlFile: 'cypress/support/component-index.html',
//               },
//             },
//           })`
//         }

//         if (bundler === 'vite') {
//           return dedent`
//           import { defineConfig } from 'cypress'
//           import { devServer } from '@cypress/vite-dev-server'

//           export default defineConfig({
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 // optionally provide your Vite config overrides.
//               },
//             },
//           })`
//         }

//         throw Error(`No config defined for ${bundler}`)
//       },
//     },
//   },

//   {
//     type: 'vue3',
//     name: 'Vue.js (v3)',
//     family: 'library',
//     supportedBundlers: [BUNDLER_WEBPACK, BUNDLER_WEBPACK, BUNDLER_VITE],
//     packages: [CYPRESS_VUE_3],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: 'vue',
//         version: '^3.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: STORYBOOK_VUE,
//     config: {
//       js: (bundler: Bundler) => {
//         if (bundler === 'webpack') {
//           return dedent`
//           const { devServer } = require('@cypress/webpack-dev-server')
//           // NOTE: ensure you are requiring your webpack config from the
//           // correct location.
//           const webpackConfig = require('./webpack.config.js')

//           module.exports = {
//             component: {
//               devServer,
//               devServerConfig: {
//                 webpackConfig,
//                 indexHtmlFile: 'cypress/support/component-index.html',
//               },
//             },
//           }`
//         }

//         if (bundler === 'vite') {
//           return dedent`
//           const { devServer } = require('@cypress/vite-dev-server')

//           module.exports = {
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 // optionally provide your Vite config overrides.
//               },
//             },
//           }`
//         }

//         throw Error(`No config defined for ${bundler}`)
//       },

//       ts: (bundler: Bundler) => {
//         if (bundler === 'webpack') {
//           return dedent`
//           import { defineConfig } from 'cypress'
//           import { devServer } from '@cypress/webpack-dev-server'
//           import webpackConfig from '@vue/cli-service/webpack.config'

//           export default defineConfig({
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 webpackConfig,
//               },
//             },
//           })`
//         }

//         if (bundler === 'vite') {
//           return dedent`
//           import { defineConfig } from 'cypress'
//           import { devServer } from '@cypress/vite-dev-server'

//           export default defineConfig({
//             component: {
//               devServer,
//               devServerConfig: {
//                 indexHtmlFile: 'cypress/support/component-index.html',
//                 // optionally provide your Vite config overrides.
//               },
//             },
//           })`
//         }

//         throw Error(`No config defined for ${bundler}`)
//       },
//     },
//   },
//   {
//     type: 'nextjs',
//     name: 'Next.js',
//     family: 'template',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_REACT_LATEST,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: '@cypress/react/plugins/next',
//     glob: '*.{js,jsx,tsx}',
//     category: FRONTEND_FRAMEWORK_CATEGORIES[0],
//     detectors: [
//       {
//         dependency: 'next',
//         version: '>=10.0.0',
//       },
//     ],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[0],
//     storybookDep: STORYBOOK_REACT,
//     config: {
//       js: () => ``,
//       ts: () => ``,
//     },
//   },
//   {
//     type: 'nuxtjs',
//     name: 'Nuxt.js (v2)',
//     family: 'template',
//     supportedBundlers: [BUNDLER_WEBPACK],
//     packages: [
//       CYPRESS_VUE_2,
//       BUNDLER_WEBPACK,
//     ],
//     defaultPackagePath: null,
//     glob: '*.vue',
//     detectors: [
//       {
//         dependency: 'nuxt',
//         version: '^2.0.0',
//       },
//     ],
//     category: FRONTEND_FRAMEWORK_CATEGORIES[1],
//     codeGenFramework: CODE_GEN_FRAMEWORKS[1],
//     storybookDep: null,
//     config: {
//       js: () => {
//         return dedent`
//         const { defineConfig } = require("cypress")
//         const { devServer } = require("@cypress/webpack-dev-server")
//         const { getWebpackConfig } = require("nuxt")

//         module.exports = defineConfig({
//           component: {
//             async devServer(cypressDevServerConfig, devServerConfig) {
//               const webpackConfig = await getWebpackConfig()

//               return devServer(cypressDevServerConfig, { webpackConfig, ...devServerConfig })
//             },
//             devServerConfig: {
//               indexHtmlFile: 'cypress/support/component-index.html',
//             },
//           },
//         })`
//       },
//       ts: () => {
//         return dedent`
//         import { defineConfig } from "cypress"
//         import { devServer } from "@cypress/webpack-dev-server"
//         import { getWebpackConfig } from "nuxt"

//         export default defineConfig({
//           component: {
//             async devServer(cypressDevServerConfig, devServerConfig) {
//               const webpackConfig = await getWebpackConfig()

//               return devServer(cypressDevServerConfig, { webpackConfig, ...devServerConfig })
//             },
//             devServerConfig: {
//               indexHtmlFile: 'cypress/support/component-index.html',
//             },
//           },
//         })`
//       },
//     },
//   },
// ] as const
