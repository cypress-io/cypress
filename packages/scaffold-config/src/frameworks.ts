import path from 'path'
import fs from 'fs-extra'
import * as dependencies from './dependencies'
import componentIndexHtmlGenerator from './component-index-template'
import type { CypressComponentDependency } from './dependencies'
import semver from 'semver'

export type PkgJson = { version: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }

export type WizardBundler = typeof dependencies.WIZARD_BUNDLERS[number]

export type CodeGenFramework = ComponentFrameworkDefinition['codeGenFramework']

export interface DependencyToInstall {
  dependency: CypressComponentDependency
  satisfied: boolean
  loc: string | null
  detectedVersion: string | null
}

export async function isDependencyInstalled (dependency: CypressComponentDependency, projectPath: string): Promise<DependencyToInstall> {
  try {
    const loc = require.resolve(path.join(dependency.package, 'package.json'), {
      paths: [projectPath],
    })

    const pkg = await fs.readJson(loc) as PkgJson

    if (!pkg.version) {
      throw Error(`${pkg.version} for ${dependency.package} is not a valid semantic version.`)
    }

    const satisfied = Boolean(pkg.version && semver.satisfies(pkg.version, dependency.minVersion, {
      includePrerelease: true,
    }))

    return {
      dependency,
      detectedVersion: pkg.version,
      loc,
      satisfied,
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

function getBundlerDependency (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall> {
  switch (bundler) {
    case 'vite': return isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VITE, projectPath)
    case 'webpack': return isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath)
    default: throw Error(`Unknown bundler ${bundler}`)
  }
}

const mountModule = <T extends string>(mountModule: T) => (projectPath: string) => Promise.resolve(mountModule)

const reactMountModule = async (projectPath: string) => {
  const reactPkg = await isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT, projectPath)

  if (!reactPkg.detectedVersion || !semver.valid(reactPkg.detectedVersion)) {
    return 'cypress/react'
  }

  return semver.major(reactPkg.detectedVersion) === 18 ? 'cypress/react18' : 'cypress/react'
}

export interface ComponentFrameworkDefinition {
  /**
   * A semantic, unique identifier.
   * Example: 'reactscripts', 'nextjs'
   */
  type: string

  /**
     * Used as the flag for `getPreset` for meta framworks, such as finding the webpack config for CRA, Angular, etc.
     * @see https://github.com/cypress-io/cypress/blob/ad0b2a37c2fe587f4efe4920d2e445eca5301600/npm/webpack-dev-server/src/devServer.ts#L119
     * This could be extended to be a function that a user can inject, eg:
     *
     * configFramwork: () => {
     *   return getSolidJsMetaFrameworkBundlerConfig()
     * }
     * It is also the name of the string added to `cypress.config`
     *
     * @example
     *
     * export default {
     *   component: {
     *     devServer: {
     *       framework: 'solid' // can be 'next', 'create-react-app', etc etc.
     *     }
     *   }
     * }
     */
  configFramework: string // 'create-react-app',

  /**
     * Library (React, Vue) or template (aka "meta framework") (CRA, Next.js, Angular)
     */
  category: 'library' | 'template'

  /**
     * Implement a similar interface to https://github.com/cypress-io/cypress/blob/ad0b2a37c2fe587f4efe4920d2e445eca5301600/npm/webpack-dev-server/src/devServer.ts#L117
     *
     * Only required for `category: framework`.
     *
     * @cypress/webpack-dev-server will need updating to receive custom `devServerHandler`.
     * @cypress/vite-dev-server does not currently support the concept of a framework config preset yet, but this can be added.
     *
     * NOTE: This could be a "fast follow" if we want to reduce the scope of this brief.
     */
  getDevServerConfig?: () => Promise<{ frameworkConfig: any }>

  /**
     * Name displayed in Launchpad when doing initial setup.
     * @example 'Solid.js', 'Create React App'
     */
  name: string

  /**
     * Supported bundlers.
     */
  supportedBundlers: Array<typeof dependencies.WIZARD_DEPENDENCY_WEBPACK | typeof dependencies.WIZARD_DEPENDENCY_VITE>

  /**
     * Used to attempt to automatically select the correct framework/bundler from the dropdown.
     * @example
     *
     * const SOLID_DETECTOR: Dependency = {
     *   type: 'solid',
     *   name: 'Solid.js',
     *   package: 'solid-js',
     *   installer: 'solid-js',
     *   description: 'Solid is a declarative JavaScript library for creating user interfaces',
     *   minVersion: '^1.0.0',
     * }
     */
  detectors: CypressComponentDependency[]

  /**
     * Array of required dependencies. This could be the bundler and JavaScript library.
     * It's the same type as `detectors`.
     */
  dependencies: (bundler: WizardBundler['type'], projectPath: string) => Promise<DependencyToInstall[]>
  // dependencies: () => Promise<CypressComponentDependency[]>

  /**
     * @internal
     * This is used interally by Cypress for the "Create From Component" feature.
     * @example 'react'
     */
  codeGenFramework: 'react' | 'vue' | 'svelte' | 'angular'

  /**
     * @internal
     * This is used interally by Cypress for the "Create From Component" feature.
     * @example '*.{js,jsx,tsx}'
     */
  glob: string

  /**
     * This is the path to get mount, eg `import { mount } from <mount_module>,
     * @example: `cypress-ct-solidjs/src/mount`
     */
  mountModule: (projectPath: string) => Promise<string>

  /**
     * Support status. Internally alpha | beta | full.
     * Community integrations are "community".
     */
  supportStatus: 'alpha' | 'beta' | 'full' | 'community'

  /**
     * Function returning string for used for the component-index.html file.
     * Cypress provides a default if one isn't specified for third party integrations.
     */
  componentIndexHtml?: () => string

  /**
     * @internal
     */
  specPattern?: '**/*.cy.ts'
}

export const CT_FRAMEWORKS: ComponentFrameworkDefinition[] = [
  {
    type: 'reactscripts',
    configFramework: 'create-react-app',
    category: 'template',
    name: 'Create React App',
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    detectors: [dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS],
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT_DOM, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
      ])
    },
    codeGenFramework: 'react',
    glob: '*.{js,jsx,tsx}',
    mountModule: reactMountModule,
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
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue2'),
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
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue'),
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
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_NEXT, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT_DOM, projectPath),
      ])
    },
    codeGenFramework: 'react',
    glob: '*.{js,jsx,tsx}',
    mountModule: reactMountModule,
    supportStatus: 'full',
    /**
     * Next.js uses style-loader to inject CSS and requires this element to exist in the HTML.
     * @see: https://github.com/vercel/next.js/blob/5f3351dbb8de71bcdbc91d869c04bc862a25da5f/packages/next/build/webpack/config/blocks/css/loaders/client.ts#L24
     */
    componentIndexHtml: componentIndexHtmlGenerator([
      `<!-- Used by Next.js to inject CSS. -->\n`,
      `<div id="__next_css__DO_NOT_USE__"></div>`,
    ].join(' '.repeat(8))),
  },
  {
    type: 'nuxtjs',
    configFramework: 'nuxt',
    category: 'template',
    name: 'Nuxt.js (v2)',
    detectors: [dependencies.WIZARD_DEPENDENCY_NUXT],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_NUXT, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue2'),
    supportStatus: 'alpha',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'vue2',
    configFramework: 'vue',
    category: 'library',
    name: 'Vue.js 2',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_2],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue2'),
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
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue'),
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
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT_DOM, projectPath),
      ])
    },
    codeGenFramework: 'react',
    glob: '*.{js,jsx,tsx}',
    mountModule: reactMountModule,
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
  {
    type: 'angular',
    configFramework: 'angular',
    category: 'template',
    name: 'Angular',
    detectors: [dependencies.WIZARD_DEPENDENCY_ANGULAR_CLI],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_ANGULAR_CLI, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_ANGULAR_DEVKIT_BUILD_ANGULAR, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_ANGULAR_CORE, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_ANGULAR_COMMON, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_ANGULAR_PLATFORM_BROWSER_DYNAMIC, projectPath),
      ])
    },
    codeGenFramework: 'angular',
    glob: '*.component.ts',
    mountModule: mountModule('cypress/angular'),
    supportStatus: 'full',
    componentIndexHtml: componentIndexHtmlGenerator(),
    specPattern: '**/*.cy.ts',
  },
  {
    type: 'svelte',
    configFramework: 'svelte',
    category: 'library',
    name: 'Svelte.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_SVELTE],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler: WizardBundler['type'], projectPath: string): Promise<DependencyToInstall[]> => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_SVELTE, projectPath),
      ])
    },
    codeGenFramework: 'svelte',
    glob: '*.svelte',
    mountModule: mountModule('cypress/svelte'),
    supportStatus: 'alpha',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
]
