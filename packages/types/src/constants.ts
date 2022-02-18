export const PLUGINS_STATE = ['uninitialized', 'initializing', 'initialized', 'error'] as const

export type PluginsState = typeof PLUGINS_STATE[number]

const d = {
  cypressReact: {
    name: '@cypress/react',
    package: '@cypress/react',
    description: 'Allows Cypress to mount each React component using <span class="text-purple-400">cy.mount()</span>',
  },
  cypressVue: {
    name: '@cypress/vue',
    package: '@cypress/vue',
    description: 'Allows Cypress to mount each Vue component using <span class="text-purple-400">cy.mount()</span>',
  },
  cypressVue2: {
    name: '@cypress/vue',
    package: '@cypress/vue@2',
    description: 'Allows Cypress to mount each Vue (v2) component using <span class="text-purple-400">cy.mount()</span>',
  },
  cypressWebpackDevServer: {
    name: '@cypress/webpack-dev-server',
    package: '@cypress/webpack-dev-server',
    description: 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  },
  cypressViteDevServer: {
    name: '@cypress/vite-dev-server',
    package: '@cypress/vite-dev-server',
    description: 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  },
  htmlWebpackPlugin: {
    name: 'html-webpack-plugin',
    package: 'html-webpack-plugin',
    description: 'Plugin that simplifies creation of HTML files to serve your bundles',
  },
  htmlWebpackPlugin4: {
    name: 'html-webpack-plugin',
    package: 'html-webpack-plugin@4',
    description: 'Plugin that simplifies creation of HTML files to serve your bundles',
  },
  webpack: {
    name: 'webpack',
    package: 'webpack',
    description: 'Bundle JavaScript files for usage in a browser',
  },
  webpack4: {
    name: 'webpack',
    package: 'webpack@4',
    description: 'Bundle JavaScript files for usage in a browser',
  },
  webpackDevServer: {
    name: 'webpack-dev-server',
    package: 'webpack-dev-server',
    description: 'Use webpack with a development server that provides live reloading',
  },
  storybookTestingReact: {
    name: '@storybook/testing-react',
    package: '@storybook/testing-react',
    description: 'Testing utilities that allow you to reuse your stories in your unit tests',
  },
  storybookTestingVue: {
    name: '@storybook/testing-vue3',
    package: '@storybook/testing-vue3',
    description: 'Testing utilities that allow you to reuse your stories in your unit tests',
  },
} as const

const webpack4Deps = [d.webpack4, d.webpackDevServer, d.htmlWebpackPlugin4]
const webpackDeps = [d.webpack, d.webpackDevServer, d.htmlWebpackPlugin]

export const COMPONENT_DEPS = d

export type ComponentDep = typeof COMPONENT_DEPS[keyof typeof COMPONENT_DEPS]

export const BUNDLERS = [
  {
    type: 'webpack',
    name: 'Webpack',
    dep: d.cypressWebpackDevServer,
  },
  {
    type: 'vite',
    name: 'Vite',
    dep: d.cypressViteDevServer,
  },
] as const

export type Bundler = typeof BUNDLERS[number]

export const CODE_GEN_FRAMEWORKS = ['react', 'vue'] as const

export type CodeGenFramework = typeof CODE_GEN_FRAMEWORKS[number]

export const FRONTEND_FRAMEWORK_CATEGORIES = ['react', 'vue'] as const

export const FRONTEND_FRAMEWORKS = [
  {
    type: 'cra',
    name: 'Create React App',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    defaultPackagePath: '@cypress/react/plugins/react-scripts',
    glob: '*.{jsx,tsx}',
    deps: ['react-scripts', 'react', 'react-dom'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: d.storybookTestingReact,
    variants: [
      {
        name: 'Create React App 4',
        bundler: 'webpack',
        deps: [{
          package: 'react-scripts',
          satisfies: '=4',
          example: { 'react-scripts': '4.0.0' },
        }],
        depsToInstall: [d.cypressReact, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: true,
      },
      {
        name: 'Create React App 5',
        bundler: 'webpack',
        dep: 'react-scripts',
        deps: [{
          package: 'react-scripts',
          satisfies: '>=5',
          example: { 'react-scripts': '5.0.0' },
        }],
        depsToInstall: [d.cypressReact, d.cypressWebpackDevServer, ...webpackDeps],
        supportsStorybook: true,
      },
    ],
  },
  {
    type: 'vuecli',
    name: 'Vue CLI',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    defaultPackagePath: null,
    glob: '*.vue',
    deps: ['@vue/cli-service', 'vue'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: d.storybookTestingVue,
    variants: [
      {
        name: 'Vue CLI (4) + Vue 2',
        bundler: 'webpack',
        deps: [
          {
            package: '@vue/cli-service',
            satisfies: '=4',
            example: { '@vue/cli-service': '4.0.0' },
          },
          {
            package: 'vue',
            satisfies: '=2',
            example: { 'vue': '2.0.0' },
          },
        ],
        depsToInstall: [d.cypressVue2, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: false,
      },
      {
        name: 'Vue CLI (4) + Vue 3',
        bundler: 'webpack',
        deps: [
          {
            package: '@vue/cli-service',
            satisfies: '=4',
            example: { '@vue/cli-service': '4.0.0' },
          },
          {
            package: 'vue',
            satisfies: '>=3',
            example: { 'vue': '3.0.0' },
          },
        ],
        depsToInstall: [d.cypressVue, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: true,
      },
      {
        name: 'Vue CLI (5) + Vue 3',
        bundler: 'webpack',
        deps: [
          {
            package: '@vue/cli-service',
            satisfies: '>=5',
            example: { '@vue/cli-service': '5.0.0' },
          },
          {
            package: 'vue',
            satisfies: '>=3',
            example: { 'vue': '3.0.0' },
          },
        ],
        depsToInstall: [d.cypressVue, d.cypressWebpackDevServer, ...webpackDeps],
        supportsStorybook: true,
      },
    ],
  },
  {
    type: 'react',
    name: 'React.js',
    supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
    defaultPackagePath: null,
    glob: '*.{jsx,tsx}',
    deps: ['react', 'react-dom'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: d.storybookTestingReact,
    variants: [
      {
        name: 'React + Webpack 4',
        bundler: 'webpack',
        deps: [{
          package: 'webpack',
          satisfies: '=4',
          example: { 'webpack': '4.0.0' },
        }],
        depsToInstall: [d.cypressReact, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: false,
      },
      {
        name: 'React + Webpack 5',
        bundler: 'webpack',
        deps: [{
          package: 'webpack',
          satisfies: '>=5',
          example: { 'webpack': '5.0.0' },
        }],
        depsToInstall: [d.cypressReact, d.cypressWebpackDevServer, ...webpackDeps],
        supportsStorybook: false,
      },
      {
        name: 'React + Vite',
        bundler: 'vite',
        deps: [],
        depsToInstall: [d.cypressReact, d.cypressViteDevServer],
        supportsStorybook: true,
      },
    ],
  },
  {
    type: 'vue',
    name: 'Vue.js',
    supportedBundlers: ['webpack', 'vite'] as readonly Bundler['type'][],
    defaultPackagePath: null,
    glob: '*.vue',
    deps: ['vue'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: d.storybookTestingVue,
    variants: [
      {
        name: 'Vue 2 + Webpack 4',
        bundler: 'webpack',
        deps: [{
          package: 'webpack',
          satisfies: '=4',
          example: { 'webpack': '4.0.0' },
        }, {
          package: 'vue',
          satisfies: '=2',
          example: { 'vue': '2.0.0' },
        }],
        depsToInstall: [d.cypressVue2, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: false,
      },
      {
        name: 'Vue 3 + Webpack 4',
        bundler: 'webpack',
        deps: [{
          package: 'webpack',
          satisfies: '=4',
          example: { 'webpack': '4.0.0' },
        }, {
          package: 'vue',
          satisfies: '>=3',
          example: { 'vue': '3.0.0' },
        }],
        depsToInstall: [d.cypressVue, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: true,
      },
      {
        name: 'Vue 2 + Webpack 5',
        bundler: 'webpack',
        deps: [{
          package: 'webpack',
          satisfies: '>=5',
          example: { 'webpack': '5.0.0' },
        }, {
          package: 'vue',
          satisfies: '=2',
          example: { 'vue': '2.0.0' },
        }],
        depsToInstall: [d.cypressVue2, d.cypressWebpackDevServer, ...webpackDeps],
        supportsStorybook: false,
      },
      {
        name: 'Vue 3 + Webpack 5',
        bundler: 'webpack',
        deps: [{
          package: 'webpack',
          satisfies: '>=5',
          example: { 'webpack': '5.0.0' },
        }, {
          package: 'vue',
          satisfies: '>=3',
          example: { 'vue': '3.0.0' },
        }],
        depsToInstall: [d.cypressVue, d.cypressWebpackDevServer, ...webpackDeps],
        supportsStorybook: true,
      },
      {
        name: 'Vue 3 + Vite',
        bundler: 'vite',
        deps: [],
        depsToInstall: [d.cypressVue, d.cypressViteDevServer],
        supportsStorybook: true,
      },
    ],
  },
  {
    type: 'nextjs',
    name: 'Next.js',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    defaultPackagePath: '@cypress/react/plugins/next',
    glob: '*.{js,ts,jsx,tsx}',
    deps: ['next', 'react', 'react-dom'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: d.storybookTestingReact,
    variants: [
      {
        name: 'Next.js',
        bundler: 'webpack',
        deps: [],
        depsToInstall: [d.cypressReact, d.cypressWebpackDevServer, ...webpackDeps],
        supportsStorybook: true,
      },
    ],
  },
  {
    type: 'nuxtjs',
    name: 'Nuxt.js',
    supportedBundlers: ['webpack'] as readonly Bundler['type'][],
    defaultPackagePath: null,
    glob: '*.vue',
    deps: ['nuxt'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: d.storybookTestingVue,
    variants: [
      {
        name: 'Nuxt.js',
        bundler: 'webpack',
        deps: [],
        depsToInstall: [d.cypressVue2, d.cypressWebpackDevServer, ...webpack4Deps],
        supportsStorybook: false,
      },
    ],
  },
] as const

export type FrontendVariant = {
  name: FrontendFramework['variants'][number]['name']
  bundler: Bundler['type']
  deps: FrontendFramework['variants'][number]['deps']
  depsToInstall: FrontendFramework['variants'][number]['depsToInstall']
  supportsStorybook: boolean
}

export type FrontendFramework = typeof FRONTEND_FRAMEWORKS[number]

export const CODE_LANGUAGES = [
  {
    type: 'js',
    name: 'JavaScript',
  },
  {
    type: 'ts',
    name: 'TypeScript',
  },
] as const

export type CodeLanguage = typeof CODE_LANGUAGES[number]

export const MIGRATION_STEPS = ['renameAuto', 'renameManual', 'renameSupport', 'configFile', 'setupComponent'] as const

export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm'] as const
