import path from 'path'
import fs from 'fs-extra'
import * as dependencies from './dependencies'
import componentIndexHtmlGenerator from './component-index-template'
import debugLib from 'debug'
import semver from 'semver'

const debug = debugLib('cypress:scaffold-config:frameworks')

export type PkgJson = { version: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }

export type WizardBundler = typeof dependencies.WIZARD_BUNDLERS[number]

export type CodeGenFramework = Cypress.ResolvedComponentFrameworkDefinition['codeGenFramework']

export async function isDependencyInstalled (dependency: Cypress.CypressComponentDependency, projectPath: string): Promise<Cypress.DependencyToInstall> {
  try {
    debug('detecting %s in %s', dependency.package, projectPath)
    const loc = require.resolve(path.join(dependency.package, 'package.json'), {
      paths: [projectPath],
    })

    const pkg = await fs.readJson(loc) as PkgJson

    debug('found package.json %o', pkg)

    if (!pkg.version) {
      throw Error(`${pkg.version} for ${dependency.package} is not a valid semantic version.`)
    }

    const satisfied = Boolean(pkg.version && semver.satisfies(pkg.version, dependency.minVersion, {
      includePrerelease: true,
    }))

    debug('%s is satisfied? %s', dependency.package, satisfied)

    return {
      dependency,
      detectedVersion: pkg.version,
      loc,
      satisfied,
    }
  } catch (e) {
    debug('error when detecting %s: %s', dependency.package, e.message)

    return {
      dependency,
      detectedVersion: null,
      loc: null,
      satisfied: false,
    }
  }
}

export function getBundler (bundler: WizardBundler['type']): WizardBundler {
  switch (bundler) {
    case 'vite': return dependencies.WIZARD_DEPENDENCY_VITE
    case 'webpack': return dependencies.WIZARD_DEPENDENCY_WEBPACK
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

export const supportStatus = ['alpha', 'beta', 'full', 'community'] as const

export const CT_FRAMEWORKS: ComponentFrameworkDefinition[] = [
  {
    type: 'reactscripts',
    configFramework: 'create-react-app',
    category: 'template',
    name: 'Create React App',
    supportedBundlers: ['webpack'],
    detectors: [dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS,
        dependencies.WIZARD_DEPENDENCY_REACT_DOM,
        dependencies.WIZARD_DEPENDENCY_REACT,
      ]
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
    supportedBundlers: ['webpack'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE,
        dependencies.WIZARD_DEPENDENCY_VUE_2,
      ]
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
    supportedBundlers: ['webpack'],
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, dependencies.WIZARD_DEPENDENCY_VUE_3],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE,
        dependencies.WIZARD_DEPENDENCY_VUE_3,
      ]
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
    supportedBundlers: ['webpack'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        dependencies.WIZARD_DEPENDENCY_NEXT,
        dependencies.WIZARD_DEPENDENCY_REACT,
        dependencies.WIZARD_DEPENDENCY_REACT_DOM,
      ]
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
    supportedBundlers: ['webpack'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        dependencies.WIZARD_DEPENDENCY_NUXT,
        dependencies.WIZARD_DEPENDENCY_VUE_2,
      ]
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
    supportedBundlers: ['webpack', 'vite'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        getBundler(bundler),
        dependencies.WIZARD_DEPENDENCY_VUE_2,
      ]
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
    supportedBundlers: ['webpack', 'vite'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        getBundler(bundler),
        dependencies.WIZARD_DEPENDENCY_VUE_3,
      ]
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
    supportedBundlers: ['webpack', 'vite'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        getBundler(bundler),
        dependencies.WIZARD_DEPENDENCY_REACT,
        dependencies.WIZARD_DEPENDENCY_REACT_DOM,
      ]
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
    supportedBundlers: ['webpack'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        dependencies.WIZARD_DEPENDENCY_ANGULAR_CLI,
        dependencies.WIZARD_DEPENDENCY_ANGULAR_DEVKIT_BUILD_ANGULAR,
        dependencies.WIZARD_DEPENDENCY_ANGULAR_CORE,
        dependencies.WIZARD_DEPENDENCY_ANGULAR_COMMON,
        dependencies.WIZARD_DEPENDENCY_ANGULAR_PLATFORM_BROWSER_DYNAMIC,
      ]
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
    supportedBundlers: ['webpack', 'vite'],
    dependencies: (bundler: WizardBundler['type']): Cypress.CypressComponentDependency[] => {
      return [
        getBundler(bundler),
        dependencies.WIZARD_DEPENDENCY_SVELTE,
      ]
    },
    codeGenFramework: 'svelte',
    glob: '*.svelte',
    mountModule: mountModule('cypress/svelte'),
    supportStatus: 'alpha',
    componentIndexHtml: componentIndexHtmlGenerator(),
  },
]

export type ComponentFrameworkDefinition = Omit<Cypress.ResolvedComponentFrameworkDefinition, 'dependencies'> & {
  dependencies: (bundler: WizardBundler['type']) => Cypress.CypressComponentDependency[]
}

export function defineComponentFrameworkInternal (definition: ComponentFrameworkDefinition): ComponentFrameworkDefinition {
  return definition
}

// Certain properties are not supported for third party frameworks right now, such as ones related to the "Create From" feature.
type ThirdPartyComponentFrameworkDefinition = Omit<ComponentFrameworkDefinition, 'glob' | 'codeGenFramework' | 'supportStatus' | 'specPattern'>

/**
 * Define a component framework to be embedded in the Cypress Component Testing
 * onboarding workflow.
 *
 * This is a no-op at runtime - it's purely for type safety.
 */
export function defineComponentFramework (definition: ThirdPartyComponentFrameworkDefinition): ThirdPartyComponentFrameworkDefinition {
  return definition
}

export function resolveComponentFrameworkDefinition (definition: ComponentFrameworkDefinition | ThirdPartyComponentFrameworkDefinition): Cypress.ResolvedComponentFrameworkDefinition {
  return {
    ...definition,
    supportStatus: definition.type.startsWith('cypress-ct-') ? 'community' : (definition as ComponentFrameworkDefinition).supportStatus,
    dependencies: async (bundler, projectPath) => {
      const declaredDeps = definition.dependencies(bundler)

      // Must add bundler based on launchpad selection if it's a third party definition.
      if (definition.type.startsWith('cypress-ct-')) {
        declaredDeps.push(getBundler(bundler))
      }

      return await Promise.all(declaredDeps.map((dep) => isDependencyInstalled(dep, projectPath)))
    },
  }
}
