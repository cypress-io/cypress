import { CODE_LANGUAGES } from '@packages/types'
import { BUNDLERS, FRONTEND_FRAMEWORKS } from '@packages/scaffold-config'
import { enumType } from 'nexus'

export const SupportedBundlerEnum = enumType({
  name: 'SupportedBundlers',
  description: 'The bundlers that we can use with Cypress',
  members: BUNDLERS.map((t) => t.type),
})

export const SupportedPackageEnum = enumType({
  name: 'SupportedPackage',
  description: 'The packages for bundlers that we can use with Cypress',
  members: BUNDLERS.map((t) => t.package),
})

export const WizardConfigFileStatusEnum = enumType({
  name: 'WizardConfigFileStatusEnum',
  members: ['changes', 'valid', 'skipped', 'error'],
})

export const FrontendFrameworkEnum = enumType({
  name: 'FrontendFrameworkEnum',
  members: FRONTEND_FRAMEWORKS.map((t) => t.type),
})

export const FrontendFrameworkCategoryEnum = enumType({
  name: 'FrontendFrameworkCategoryEnum',
  members: FRONTEND_FRAMEWORKS.map((t) => t.category),
})

export const CodeLanguageEnum = enumType({
  name: 'CodeLanguageEnum',
  members: CODE_LANGUAGES.map((t) => t.type),
})

export const TestingTypeEnum = enumType({
  name: 'TestingTypeEnum',
  members: ['e2e', 'component'],
})
