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
