import { enumType } from 'nexus'

import type { NexusGenEnums } from '../gen/nxs.gen'

export const BUNDLER = ['webpack', 'vite'] as const

export type Bundler = typeof BUNDLER[number]

export const BundlerEnum = enumType({
  name: 'SupportedBundlers',
  description: 'The bundlers that we can use with Cypress',
  members: BUNDLER,
})

export const BundlerDisplayNames: Record<NexusGenEnums['SupportedBundlers'], string> = {
  vite: 'Vite',
  webpack: 'Webpack',
}

export const BundlerPackageNames: Record<NexusGenEnums['SupportedBundlers'], string> = {
  vite: '@cypress/vite-dev-server',
  webpack: '@cypress/webpack-dev-server',
}

export const FRONTEND_FRAMEWORK = ['nuxtjs', 'nextjs', 'cra', 'vuecli', 'reactjs', 'vuejs'] as const

export type FrontendFramework = typeof FRONTEND_FRAMEWORK[number]

export const FrontendFrameworkEnum = enumType({
  name: 'FrontendFramework',
  members: FRONTEND_FRAMEWORK,
})

export const FrameworkDisplayNames: Record<NexusGenEnums['FrontendFramework'], string> = {
  cra: 'Create React App',
  vuecli: 'Vue CLI',
  reactjs: 'React.js',
  vuejs: 'Vue.js',
  nextjs: 'Next.js',
  nuxtjs: 'Nuxt.js',
}

export const TESTING_TYPES = ['component', 'e2e'] as const

export type TestingType = typeof TESTING_TYPES[number]

export const TestingTypeEnum = enumType({
  name: 'TestingTypeEnum',
  members: TESTING_TYPES,
})

export const TestingTypeNames: Record<TestingType, string> = {
  component: 'Component Testing',
  e2e: 'E2E Testing',
}

export const TestingTypeDescriptions: Record<TestingType, string> = {
  component: 'Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.',
  e2e: 'Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.',
}

export const WIZARD_STEP = [
  'welcome',
  'selectFramework',
  'installDependencies',
  'createConfig',
  'setupComplete',
] as const

export type WizardStep = typeof WIZARD_STEP[number]

export const WizardStepEnum = enumType({
  name: 'WizardStep',
  members: WIZARD_STEP,
})

export const WIZARD_TITLES: Record<WizardStep, string | null> = {
  welcome: 'Welcome to Cypress',
  selectFramework: 'Project Setup',
  installDependencies: 'Install Dev Dependencies',
  createConfig: 'Cypress.config',
  setupComplete: 'Setup Finished',
}

export const WIZARD_DESCRIPTIONS: Record<WizardStep, string | null> = {
  welcome: 'Choose which method of testing you would like to set up first.',
  selectFramework: 'Confirm the front-end framework and bundler fused in your project.',
  installDependencies: 'We need to install the following packages in order for component testing to work.',
  createConfig: 'Cypress will now create the following config file in the local directory for this project.',
  setupComplete: '<em>cypress.config.js</em> file was successfully added to your project.Let’s open your browser and start testing some components!',
}
