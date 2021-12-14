export const PLUGINS_STATE = ['uninitialized', 'initializing', 'initialized', 'error'] as const

export type PluginsState = typeof PLUGINS_STATE[number]

export const BUNDLERS = [
  {
    type: 'webpack',
    name: 'Webpack',
    package: '@cypress/webpack-dev-server',
  },
  {
    type: 'vite',
    name: 'Vite',
    package: '@cypress/vite-dev-server',
  },
] as const

export type Bundler = typeof BUNDLERS[number]

export const CODE_GEN_FRAMEWORKS = ['react', 'vue'] as const

export type CodeGenFramework = typeof CODE_GEN_FRAMEWORKS[number]

export const FRONTEND_FRAMEWORK_CATEGORIES = ['react', 'vue', 'other'] as const

export const STORYBOOK_DEPS = [
  '@storybook/testing-react',
  '@storybook/testing-vue3',
] as const

export const FRONTEND_FRAMEWORKS = [
  {
    type: 'cra',
    name: 'Create React App',
    supportedBundlers: ['webpack'],
    package: '@cypress/react',
    glob: '**/*.{jsx,tsx}',
    deps: ['react-scripts', 'react', 'react-dom'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_DEPS[0],
  },
  {
    type: 'vuecli',
    name: 'Vue CLI',
    supportedBundlers: ['webpack'],
    package: '@cypress/vue',
    glob: '**/*.vue',
    deps: ['@vue/cli-service', 'vue'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: STORYBOOK_DEPS[1],
  },
  {
    type: 'react',
    name: 'React.js',
    supportedBundlers: ['webpack', 'vite'],
    package: '@cypress/react',
    glob: '**/*.{jsx,tsx}',
    deps: ['react', 'react-dom'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_DEPS[0],
  },
  {
    type: 'vue',
    name: 'Vue.js',
    supportedBundlers: ['webpack', 'vite'],
    package: '@cypress/vue',
    glob: '**/*.vue',
    deps: ['vue'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: STORYBOOK_DEPS[1],
  },
  {
    type: 'nextjs',
    name: 'Next.js',
    supportedBundlers: ['webpack'],
    package: '@cypress/react',
    glob: '**/*.{jsx,tsx}',
    deps: ['next', 'react', 'react-dom'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[0],
    codeGenFramework: CODE_GEN_FRAMEWORKS[0],
    storybookDep: STORYBOOK_DEPS[0],
  },
  {
    type: 'nuxtjs',
    name: 'Nuxt.js',
    supportedBundlers: ['webpack'],
    package: '@cypress/vue',
    glob: '**/*.vue',
    deps: ['nuxt'],
    category: FRONTEND_FRAMEWORK_CATEGORIES[1],
    codeGenFramework: CODE_GEN_FRAMEWORKS[1],
    storybookDep: STORYBOOK_DEPS[1],
  },
] as const

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

export const WIZARD_STEPS = [
  {
    type: 'welcome',
    title: 'Welcome to Cypress!',
    description: 'Choose which method of testing you would like to get started with for this project.',
  },
  {
    type: 'initializePlugins',
    title: 'Initializing Config...',
    description: 'Please wait while we load your project and find browsers installed on your system.',
  },
  {
    type: 'selectFramework',
    title: 'Project Setup',
    description: 'Confirm the front-end framework and bundler used in your project.',
  },
  {
    type: 'installDependencies',
    title: 'Install Dev Dependencies',
    description: 'Paste the command below into your terminal to install the required packages.',
  },
  {
    type: 'configFiles',
    title: 'Configuration Files',
    description: 'We added the following files to your project.',
  },
  {
    type: 'setupComplete',
    title: 'Choose a Browser',
    description: 'Choose your preferred browser for testing your components.',
  },
] as const

export type AllPackages = FrontendFramework['package'] | Bundler['package'] | typeof STORYBOOK_DEPS[number]

export type AllPackageTypes = FrontendFramework['type'] | Bundler['type']

export const PACKAGES_DESCRIPTIONS: Record<AllPackages, string> = {
  '@cypress/vue': 'Allows Cypress to mount each Vue component using <span class="text-purple-400">cy.mount()</span>',
  '@cypress/react': 'Allows Cypress to mount each React component using <span class="text-purple-400">cy.mount()</span>',
  '@cypress/webpack-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@cypress/vite-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@storybook/testing-react': 'Testing utilities that allow you to reuse your stories in your unit tests',
  '@storybook/testing-vue3': 'Testing utilities that allow you to reuse your stories in your unit tests',
} as const
