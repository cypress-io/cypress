'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.WIZARD_FRAMEWORKS = exports.isDependencyInstalled = void 0

const tslib_1 = require('tslib')
const path_1 = tslib_1.__importDefault(require('path'))
const fs_extra_1 = tslib_1.__importDefault(require('fs-extra'))
const dependencies = tslib_1.__importStar(require('./dependencies'))
const component_index_template_1 = tslib_1.__importDefault(require('./component-index-template'))
const semver_1 = tslib_1.__importDefault(require('semver'))

async function isDependencyInstalled (dependency, projectPath) {
  try {
    const loc = require.resolve(path_1.default.join(dependency.package, 'package.json'), {
      paths: [projectPath],
    })
    const pkg = await fs_extra_1.default.readJson(loc)

    if (!pkg.version) {
      throw Error(`${pkg.version} for ${dependency.package} is not a valid semantic version.`)
    }

    const satisfied = Boolean(pkg.version && semver_1.default.satisfies(pkg.version, dependency.minVersion, {
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
exports.isDependencyInstalled = isDependencyInstalled

function getBundlerDependency (bundler, projectPath) {
  switch (bundler) {
    case 'vite': return isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VITE, projectPath)
    case 'webpack': return isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_WEBPACK, projectPath)
    default: throw Error(`Unknown bundler ${bundler}`)
  }
}
const mountModule = (mountModule) => (projectPath) => Promise.resolve(mountModule)
const reactMountModule = async (projectPath) => {
  const reactPkg = await isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_REACT, projectPath)

  if (!reactPkg.detectedVersion || !semver_1.default.valid(reactPkg.detectedVersion)) {
    return 'cypress/react'
  }

  return semver_1.default.major(reactPkg.detectedVersion) === 18 ? 'cypress/react18' : 'cypress/react'
}

exports.WIZARD_FRAMEWORKS = [
  {
    type: 'reactscripts',
    configFramework: 'create-react-app',
    category: 'template',
    name: 'Create React App',
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    detectors: [dependencies.WIZARD_DEPENDENCY_REACT_SCRIPTS],
    dependencies: (bundler, projectPath) => {
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
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'vueclivue2',
    configFramework: 'vue-cli',
    category: 'template',
    name: 'Vue CLI (Vue 2)',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, dependencies.WIZARD_DEPENDENCY_VUE_2],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler, projectPath) => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue2'),
    supportStatus: 'full',
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'vueclivue3',
    configFramework: 'vue-cli',
    category: 'template',
    name: 'Vue CLI (Vue 3)',
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, dependencies.WIZARD_DEPENDENCY_VUE_3],
    dependencies: (bundler, projectPath) => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_CLI_SERVICE, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue'),
    supportStatus: 'full',
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'nextjs',
    category: 'template',
    configFramework: 'next',
    name: 'Next.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_NEXT],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler, projectPath) => {
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
    componentIndexHtml: (0, component_index_template_1.default)([
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
    dependencies: (bundler, projectPath) => {
      return Promise.all([
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_NUXT, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue2'),
    supportStatus: 'alpha',
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'vue2',
    configFramework: 'vue',
    category: 'library',
    name: 'Vue.js 2',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_2],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler, projectPath) => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_2, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue2'),
    supportStatus: 'full',
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'vue3',
    configFramework: 'vue',
    category: 'library',
    name: 'Vue.js 3',
    detectors: [dependencies.WIZARD_DEPENDENCY_VUE_3],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler, projectPath) => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_VUE_3, projectPath),
      ])
    },
    codeGenFramework: 'vue',
    glob: '*.vue',
    mountModule: mountModule('cypress/vue'),
    supportStatus: 'full',
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'react',
    configFramework: 'react',
    category: 'library',
    name: 'React.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_REACT],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler, projectPath) => {
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
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
  {
    type: 'angular',
    configFramework: 'angular',
    category: 'template',
    name: 'Angular',
    detectors: [dependencies.WIZARD_DEPENDENCY_ANGULAR_CLI],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK],
    dependencies: (bundler, projectPath) => {
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
    componentIndexHtml: (0, component_index_template_1.default)(),
    specPattern: '**/*.cy.ts',
  },
  {
    type: 'svelte',
    configFramework: 'svelte',
    category: 'library',
    name: 'Svelte.js',
    detectors: [dependencies.WIZARD_DEPENDENCY_SVELTE],
    supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],
    dependencies: (bundler, projectPath) => {
      return Promise.all([
        getBundlerDependency(bundler, projectPath),
        isDependencyInstalled(dependencies.WIZARD_DEPENDENCY_SVELTE, projectPath),
      ])
    },
    codeGenFramework: 'svelte',
    glob: '*.svelte',
    mountModule: mountModule('cypress/svelte'),
    supportStatus: 'alpha',
    componentIndexHtml: (0, component_index_template_1.default)(),
  },
]
