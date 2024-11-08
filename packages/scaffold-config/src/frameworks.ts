import fs from 'fs-extra'
import * as dependencies from './dependencies'
import componentIndexHtmlGenerator from './component-index-template'
import debugLib from 'debug'
import semver from 'semver'
import { isThirdPartyDefinition } from './ct-detect-third-party'
import resolvePackagePath from 'resolve-package-path'

const debug = debugLib('cypress:scaffold-config:frameworks')

export type PkgJson = { version: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }

export type WizardBundler = typeof dependencies.WIZARD_BUNDLERS[number]

export type CodeGenFramework = Cypress.ResolvedComponentFrameworkDefinition['codeGenFramework']

export async function isDependencyInstalledByName (packageName: string, projectPath: string): Promise<{dependency: string, detectedVersion: string | null}> {
  let detectedVersion: string | null = null

  try {
    debug('detecting %s in %s', packageName, projectPath)

    const packageFilePath = resolvePackagePath(packageName, projectPath, false)

    if (!packageFilePath) {
      throw new Error('unable to resolve package file')
    }

    const pkg = await fs.readJson(packageFilePath) as PkgJson

    debug('found package.json %o', pkg)

    if (!pkg.version) {
      throw Error(`${pkg.version} for ${packageName} is not a valid semantic version.`)
    }

    detectedVersion = pkg.version
  } catch (e) {
    debug('error when detecting %s: %s', packageName, e.message)
  }

  return {
    dependency: packageName,
    detectedVersion,
  }
}

export async function isDependencyInstalled (dependency: Cypress.CypressComponentDependency, projectPath: string): Promise<Cypress.DependencyToInstall> {
  try {
    debug('detecting %s in %s', dependency.package, projectPath)

    const packageFilePath = resolvePackagePath(dependency.package, projectPath, false)

    if (!packageFilePath) {
      debug('unable to resolve dependency %s', dependency.package)

      return {
        dependency,
        detectedVersion: null,
        satisfied: false,
      }
    }

    const pkg = await fs.readJson(packageFilePath) as PkgJson

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
      satisfied,
    }
  } catch (e) {
    debug('error when detecting %s: %s', dependency.package, e.message)

    return {
      dependency,
      detectedVersion: null,
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

export const SUPPORT_STATUSES: Readonly<Cypress.ResolvedComponentFrameworkDefinition['supportStatus'][]> = ['alpha', 'beta', 'full', 'community'] as const

export const CT_FRAMEWORKS: Cypress.ComponentFrameworkDefinition[] = [
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
    mountModule: mountModule('cypress/react'),
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
    mountModule: mountModule('cypress/react'),
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

/**
 * Given a first or third party Component Framework Definition,
 * resolves into a unified ResolvedComponentFrameworkDefinition.
 * This way we have a single type used throughout Cypress.
 */
export function resolveComponentFrameworkDefinition (definition: Cypress.ComponentFrameworkDefinition | Cypress.ThirdPartyComponentFrameworkDefinition): Cypress.ResolvedComponentFrameworkDefinition {
  const thirdParty = isThirdPartyDefinition(definition)

  const dependencies: Cypress.ResolvedComponentFrameworkDefinition['dependencies'] = async (bundler, projectPath) => {
    const declaredDeps = definition.dependencies(bundler)

    // Must add bundler based on launchpad selection if it's a third party definition.
    if (thirdParty) {
      declaredDeps.push(getBundler(bundler))
    }

    return await Promise.all(declaredDeps.map((dep) => isDependencyInstalled(dep, projectPath)))
  }

  if (thirdParty) {
    return {
      ...definition,
      category: 'library',
      dependencies,
      configFramework: definition.type,
      supportStatus: 'community',
      mountModule: () => Promise.resolve(definition.type),
    }
  }

  return { ...definition as Cypress.ComponentFrameworkDefinition, dependencies }
}
