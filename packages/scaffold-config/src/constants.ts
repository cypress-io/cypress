import type { AllPackagePackages } from '.'

export const CODE_GEN_FRAMEWORKS = ['react', 'vue'] as const

export const FRONTEND_FRAMEWORK_CATEGORIES = ['react', 'vue'] as const

export const PACKAGES_DESCRIPTIONS: Record<AllPackagePackages, string> = {
  '@cypress/vue': 'Allows Cypress to mount each Vue component using <span class="text-purple-400">cy.mount()</span>',
  '@cypress/react': 'Allows Cypress to mount each React component using <span class="text-purple-400">cy.mount()</span>',
  '@cypress/webpack-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@cypress/vite-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@storybook/testing-react': 'Testing utilities that allow you to reuse your stories in your unit tests',
  '@storybook/testing-vue3': 'Testing utilities that allow you to reuse your stories in your unit tests',
  'webpack-dev-server': 'Webpack Dev Server to bundle and run your tests',
  'webpack': 'Webpack is a module bundler',
  'html-webpack-plugin': 'The HtmlWebpackPlugin simplifies creation of HTML files to serve your webpack bundles',
} as const

const BUNDLER_WEBPACK = {
  type: 'webpack',
  name: 'Webpack',
  package: '@cypress/webpack-dev-server',
  installer: '@cypress/webpack-dev-server@latest',
} as const

const BUNDLER_VITE = {
  type: 'vite',
  name: 'Vite',
  package: '@cypress/vite-dev-server',
  installer: '@cypress/vite-dev-server@latest',
} as const

export const BUNDLER_DEPS = [
  BUNDLER_WEBPACK,
  BUNDLER_VITE,
] as const

export const STORYBOOK_REACT = {
  type: 'storybook',
  name: ' Testing React',
  package: '@storybook/testing-react',
  installer: '@storybook/testing-react@latest',
} as const

export const STORYBOOK_VUE = {
  type: 'storybook',
  name: ' Testing Vue 3',
  package: '@storybook/testing-vue3',
  installer: '@storybook/testing-vue3@latest',
} as const

export const STORYBOOK_DEPS = [
  STORYBOOK_REACT,
  STORYBOOK_VUE,
] as const

export const CYPRESS_VUE_2 = {
  type: 'cypress-adapter',
  name: 'Cypress Vue',
  package: '@cypress/vue',
  installer: '@cypress/vue@^2.0.0',
} as const

export const CYPRESS_VUE_3 = {
  type: 'cypress-adapter',
  name: 'Cypress Vue',
  package: '@cypress/vue',
  installer: '@cypress/vue@^3.0.0',
} as const

export const WEBPACK_DEV_SERVER_4 = {
  type: 'dev-server',
  name: 'Webpack Dev Server',
  package: 'webpack-dev-server',
  installer: 'webpack-dev-server@^4.0.0',
} as const

export const WEBPACK_4 = {
  type: 'bundler',
  name: 'Webpack',
  package: 'webpack',
  installer: 'webpack@^4.0.0',
} as const

export const BUNDLERS = [
  WEBPACK_4,
]

export const HTML_WEBPACK_PLUGIN_4 = {
  type: 'other',
  name: 'HTML Webpack Plugin',
  package: 'html-webpack-plugin',
  installer: 'html-webpack-plugin@^4.0.0',
} as const

export const CYPRESS_REACT_LATEST = {
  type: 'cypress-adapter',
  name: 'Cypress React',
  package: '@cypress/react',
  installer: '@cypress/react@^5.0.0',
} as const

export const CYPRESS_ADAPTER_DEPS = [
  CYPRESS_REACT_LATEST,
  CYPRESS_VUE_2,
  CYPRESS_VUE_3,
] as const

export const DEV_SERVERS = [
  WEBPACK_DEV_SERVER_4,
]

export const DEPENDENCIES = [
  ...CYPRESS_ADAPTER_DEPS,
  ...BUNDLER_DEPS,
  ...STORYBOOK_DEPS,
  ...DEV_SERVERS,
  ...BUNDLERS,
  HTML_WEBPACK_PLUGIN_4,
] as const
