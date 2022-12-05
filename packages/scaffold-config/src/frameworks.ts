import path from 'path'
import fs from 'fs-extra'
import * as dependencies from './dependencies'
import componentIndexHtmlGenerator from './component-index-template'
import semver from 'semver'

export type PkgJson = { version: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string> }

export type WizardBundler = typeof dependencies.WIZARD_BUNDLERS[number]

export type CodeGenFramework = typeof WIZARD_FRAMEWORKS[number]['codeGenFramework']

export type WizardDependency = typeof dependencies.WIZARD_DEPENDENCIES[number]

export interface DependencyToInstall {
  dependency: WizardDependency
  satisfied: boolean
  loc: string | null
  detectedVersion: string | null
}

export type WizardFrontendFramework = typeof WIZARD_FRAMEWORKS[number] & { specPattern?: string }

export async function isDependencyInstalled (dependency: WizardDependency, projectPath: string): Promise<DependencyToInstall> {
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

export type WizardMountModule = Awaited<ReturnType<typeof WIZARD_FRAMEWORKS[number]['mountModule']>>

const mountModule = <T extends string>(mountModule: T) => (projectPath: string) => Promise.resolve(mountModule)

const reactMountModule = async (projectPath: string) => {
  const reactPkg = await isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT, projectPath)

  if (!reactPkg.detectedVersion || !semver.valid(reactPkg.detectedVersion)) {
    return 'cypress/react'
  }

  return semver.major(reactPkg.detectedVersion) === 18 ? 'cypress/react18' : 'cypress/react'
}

export const WIZARD_FRAMEWORKS = [
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
] as const
