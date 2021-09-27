import { BUNDLERS, FRONTEND_FRAMEWORKS, NAV_ITEMS, TESTING_TYPES, WIZARD_STEPS } from '@packages/types'
import { enumType } from 'nexus'

export const SupportedBundlerEnum = enumType({
  name: 'SupportedBundlers',
  description: 'The bundlers that we can use with Cypress',
  members: BUNDLERS.map((t) => t.type),
})

export const WizardNavigateDirectionEnum = enumType({
  name: 'WizardNavigateDirection',
  members: ['forward', 'back'],
})

export const FrontendFrameworkEnum = enumType({
  name: 'FrontendFrameworkEnum',
  members: FRONTEND_FRAMEWORKS.map((t) => t.type),
})

export const TestingTypeEnum = enumType({
  name: 'TestingTypeEnum',
  members: TESTING_TYPES.map((t) => t.type),
})

export const NavItemEnum = enumType({
  name: 'NavItem',
  members: NAV_ITEMS.map((t) => t.type),
})

export const WizardStepEnum = enumType({
  name: 'WizardStep',
  members: WIZARD_STEPS.map((t) => t.type),
})

export const WizardCodeLanguageEnum = enumType({
  name: 'WizardCodeLanguage',
  members: ['js', 'ts'],
})
