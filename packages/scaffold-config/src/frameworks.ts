import path from 'path'
import dedent from 'dedent'
import fs from 'fs-extra'
import * as dependencies from './dependencies'
import componentIndexHtmlGenerator from './component-index-template'
import { defineConfigAvailable } from '@packages/data-context/src/sources/migration/codegen'
import semver from 'semver'
import resolveFrom from 'resolve-from'

export type PkgJson = { version: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }

type WizardBundler = typeof dependencies.WIZARD_BUNDLERS[number]['type']

export type CodeGenFramework = typeof WIZARD_FRAMEWORKS[number]['codeGenFramework']

export type WizardDependency = typeof dependencies.WIZARD_DEPENDENCIES[number]

export interface DependencyToInstall {
  dependency: WizardDependency
  satisfied: boolean
  loc: string | null
  detectedVersion: string | null
}

export type WizardFrontendFramework = typeof WIZARD_FRAMEWORKS[number]

export function inPkgJson (dependency: WizardDependency, projectPath: string): DependencyToInstall {
  try {
    const loc = resolveFrom(projectPath, path.join(dependency.package, 'package.json'))
    const pkg = fs.readJsonSync(loc) as PkgJson
    const pkgVersion = semver.coerce(pkg.version)

    if (!pkgVersion) {
      throw Error(`${pkg.version} for ${dependency.package} is not a valid semantic version.`)
    }

    return {
      dependency,
      detectedVersion: pkg.version,
      loc,
      satisfied: Boolean(pkg.version && semver.satisfies(pkgVersion, dependency.minVersion)),
    }
  } catch (e) {
    return {
      dependency,
      detectedVersion: null,
      loc: null,
      satisfied: false,
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

interface CreateCypressConfig {
  framework: typeof WIZARD_FRAMEWORKS[number]['configFramework']
  bundler: WizardBundler
  language: 'js' | 'ts'
  projectRoot: string
}

export function createCypressConfig (config: CreateCypressConfig): string {
  const isDefineConfigAvailable = defineConfigAvailable(config.projectRoot)

  if (config.language === 'ts') {
    if (isDefineConfigAvailable) {
      return dedent`
        import { defineConfig } from 'cypress'

        export default defineConfig({
          component: {
            devServer: {
              framework: '${config.framework}',
              bundler: '${config.bundler}'
            }
          }
        })`
    }

    return dedent`
      export default {
        component: {
          devServer: {
            framework: '${config.framework}',
            bundler: '${config.bundler}'
          }
        }
      }`
  }

  if (isDefineConfigAvailable) {
    return dedent`
      const { defineConfig } = require('cypress')

      module.exports = defineConfig({
        component: {
          devServer: {
            framework: '${config.framework}',
            bundler: '${config.bundler}'
          }
        }
      })`
  }

  return dedent`
    module.exports = {
      component: {
        devServer: {
          framework: '${config.framework}',
          bundler: '${config.bundler}'
        }
      }
    }`
}

export const WIZARD_FRAMEWORKS = [
  {
    type: 'reactscripts',
    configFramework: 'create-react-app',
    category: 'template',
    name: 'Create React App',
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    detectors: [dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'react',
    glob: '*.{js,jsx,tsx}',
    mountModule: 'cypress/react',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'vueclivue2',
    configFramework: 'vue-cli',
    category: 'template',
    name: 'Vue CLI (Vue 2)',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, dependencies.WIZARD_DEPENDENCY_VUE_2],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: 'cypress/vue2',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'vueclivue3',
    configFramework: 'vue-cli',
    category: 'template',
    name: 'Vue CLI (Vue 3)',
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, dependencies.WIZARD_DEPENDENCY_VUE_3],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: 'cypress/vue',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'nextjs',
    category: 'template',
    configFramework: 'next',
    name: 'Next.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_NEXT],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        inPkgJson(dependencies.WIZARD_DEPENDENCY_NEXT, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'react',
    glob: '*.{js,jsx,tsx}',
    mountModule: 'cypress/react',
    supportStatus: 'alpha',
    componentIndexHtml: componentIndexHtmlGenerator('<div id="__next_css__DO_NOT_USE__"></div>'),
  },
  {
    type: 'nuxtjs',
    configFramework: 'nuxt',
    category: 'template',
    name: 'Nuxt.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_NUXT],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        inPkgJson(dependencies.WIZARD_DEPENDENCY_NUXT, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: 'cypress/vue2',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'vue2',
    configFramework: 'vue',
    category: 'library',
    name: 'Vue.js 2',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_2],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        getBundlerDependency(bundler, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: 'cypress/vue2',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'vue3',
    configFramework: 'vue',
    category: 'library',
    name: 'Vue.js 3',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_3],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        getBundlerDependency(bundler, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: 'cypress/vue',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'react',
    configFramework: 'react',
    category: 'library',
    name: 'React.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_REACT],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler: WizardBundler, projectPath: string): DependencyToInstall[] => {
      return [
        getBundlerDependency(bundler, projectPath),
        inPkgJson(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
      ]
    },
    createCypressConfig,
    codeGenFramework: 'react',
    glob: '*.{js,jsx,tsx}',
    mountModule: 'cypress/react',
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
] as const
