import type { AllPackages } from './types'

export const CODE_GEN_FRAMEWORKS = ['react', 'vue'] as const

export const FRONTEND_FRAMEWORK_CATEGORIES = ['react', 'vue'] as const

export const PACKAGES_DESCRIPTIONS: Record<AllPackages, string> = {
  '@cypress/vue': 'Allows Cypress to mount each Vue component using <span class="text-purple-400">cy.mount()</span>',
  '@cypress/react': 'Allows Cypress to mount each React component using <span class="text-purple-400">cy.mount()</span>',
  '@cypress/webpack-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@cypress/vite-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@storybook/testing-react': 'Testing utilities that allow you to reuse your stories in your unit tests',
  '@storybook/testing-vue3': 'Testing utilities that allow you to reuse your stories in your unit tests',
} as const

export const BUNDLERS = [
  {
    type: 'webpack',
    name: 'Webpack',
    package: '@cypress/webpack-dev-server',
    installer: '@cypress/webpack-dev-server@latest',
  },
  {
    type: 'vite',
    name: 'Vite',
    package: '@cypress/vite-dev-server',
    installer: '@cypress/vite-dev-server@latest',
  },
] as const

export const STORYBOOK_DEPS = [
  '@storybook/testing-react',
  '@storybook/testing-vue3',
] as const
