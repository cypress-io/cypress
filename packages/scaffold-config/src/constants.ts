export const CODE_GEN_FRAMEWORKS = ['react', 'vue'] as const

export const FRONTEND_FRAMEWORK_CATEGORIES = ['react', 'vue'] as const

export const STORYBOOK_REACT = {
  type: 'storybook',
  name: ' Testing React',
  package: '@storybook/testing-react',
  installer: '@storybook/testing-react@latest',
  description: 'Testing utilities that allow you to reuse your stories in your unit tests',
} as const

export const STORYBOOK_VUE = {
  type: 'storybook',
  name: ' Testing Vue 3',
  package: '@storybook/testing-vue3',
  installer: '@storybook/testing-vue3@latest',
  description: 'Testing utilities that allow you to reuse your stories in your unit tests',
} as const

export const STORYBOOK_DEPS = [
  STORYBOOK_REACT,
  STORYBOOK_VUE,
] as const

export const CYPRESS_VUE_2 = {
  type: 'cypress-adapter',
  name: 'Cypress Vue2',
  package: '@cypress/vue2',
  installer: '@cypress/vue2@^1.0.0',
  description: 'Allows Cypress to mount each Vue@2 component using <span class="text-purple-400">cy.mount()</span>',
} as const

export const CYPRESS_VUE_3 = {
  type: 'cypress-adapter',
  name: 'Cypress Vue',
  package: '@cypress/vue',
  installer: '@cypress/vue@^3.0.0',
  description: 'Allows Cypress to mount each Vue@3 component using <span class="text-purple-400">cy.mount()</span>',
} as const

export const WEBPACK_DEV_SERVER_4 = {
  type: 'dev-server',
  name: 'Webpack Dev Server',
  package: 'webpack-dev-server',
  installer: 'webpack-dev-server@^4.0.0',
  description: 'Webpack Dev Server to bundle and run your tests',
} as const

export const HTML_WEBPACK_PLUGIN_4 = {
  type: 'other',
  name: 'HTML Webpack Plugin',
  package: 'html-webpack-plugin',
  installer: 'html-webpack-plugin@^4.0.0',
  description: 'The HtmlWebpackPlugin simplifies creation of HTML files to serve your webpack bundles',
} as const

export const CYPRESS_WEBPACK = {
  type: 'webpack',
  name: 'Cypress Webpack Dev Server',
  package: '@cypress/webpack-dev-server',
  installer: '@cypress/webpack-dev-server@latest',
  description: 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
} as const

export const CYPRESS_VITE = {
  type: 'vite',
  name: 'Cypress Vite Dev Server',
  package: '@cypress/vite-dev-server',
  installer: '@cypress/vite-dev-server@latest',
  description: 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
} as const

export const CYPRESS_DEV_SERVERS = [
  CYPRESS_WEBPACK,
  CYPRESS_VITE,
] as const

export const BUNDLER_WEBPACK_4 = {
  type: 'webpack4',
  name: 'Webpack (v4)',
  package: 'webpack',
  installer: 'webpack@^4.0.0',
  description: 'Webpack is a module bundler',
  dependencies: [
    CYPRESS_WEBPACK,
    WEBPACK_DEV_SERVER_4,
    HTML_WEBPACK_PLUGIN_4,
  ],
} as const

export const HTML_WEBPACK_PLUGIN_5 = {
  type: 'other',
  name: 'HTML Webpack Plugin',
  package: 'html-webpack-plugin',
  installer: 'html-webpack-plugin@^5.0.0',
  description: 'The HtmlWebpackPlugin simplifies creation of HTML files to serve your webpack bundles',
} as const

export const BUNDLER_WEBPACK_5 = {
  type: 'webpack5',
  name: 'Webpack (v5)',
  package: 'webpack',
  installer: 'webpack@^5.0.0',
  description: 'Webpack is a module bundler',
  dependencies: [
    CYPRESS_WEBPACK,
    WEBPACK_DEV_SERVER_4,
    HTML_WEBPACK_PLUGIN_5,
  ],
} as const

export const BUNDLER_VITE = {
  type: 'vite',
  name: 'Vite',
  package: 'vite',
  installer: 'vite@^2.0.0',
  description: 'Vite is dev server that serves your source files over native ES modules',
  dependencies: [CYPRESS_VITE],
} as const

export const BUNDLERS = [
  BUNDLER_WEBPACK_4,
  BUNDLER_WEBPACK_5,
  BUNDLER_VITE,
]

export const CYPRESS_REACT_LATEST = {
  type: 'cypress-adapter',
  name: 'Cypress React',
  package: '@cypress/react',
  installer: '@cypress/react@^5.0.0',
  description: 'Allows Cypress to mount each React component using <span class="text-purple-400">cy.mount()</span>',
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
  ...CYPRESS_DEV_SERVERS,
  ...STORYBOOK_DEPS,
  ...DEV_SERVERS,
  ...BUNDLERS,
  HTML_WEBPACK_PLUGIN_4,
  HTML_WEBPACK_PLUGIN_5,
] as const
