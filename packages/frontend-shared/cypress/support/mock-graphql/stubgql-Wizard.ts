import type { CodegenTypeMap, Wizard } from '../generated/test-graphql-types.gen'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS } from '@packages/types/src/constants'
import { MaybeResolver, testNodeId } from './clientTestUtils'

export const allBundlers = BUNDLERS.map((bundler, idx) => {
  return {
    ...testNodeId('WizardBundler'),
    isSelected: idx === 0,
    ...bundler,
  }
})

export const stubWizard: MaybeResolver<Wizard> = {
  __typename: 'Wizard',
  packagesToInstall: [
    {
      ...testNodeId('WizardNpmPackage'),
      description: 'Used to interact with React components via Cypress',
      name: '@cypress/react',
      package: '@cypress/react',
    },
    {
      ...testNodeId('WizardNpmPackage'),
      description: 'Used to bundle code',
      name: '@cypress/webpack-dev-server',
      package: '@cypress/webpack-dev-server',
    },
  ],
  allBundlers,
  frameworks: FRONTEND_FRAMEWORKS.map((framework, idx) => {
    // get around readonly errors
    const supportedBundlers = framework.supportedBundlers as unknown as Array<CodegenTypeMap['WizardBundler']>

    return {
      ...testNodeId('WizardFrontendFramework'),
      ...framework,
      supportedBundlers,
      isSelected: idx === 0,
    }
  }),
  language: {
    ...testNodeId('WizardCodeLanguage'),
    type: 'ts',
    name: 'TypeScript',
    isSelected: true,
  },
  allLanguages: CODE_LANGUAGES.map((language, idx) => {
    return {
      ...testNodeId('WizardCodeLanguage'),
      ...language,
      isSelected: idx === 0,
    }
  }),
}
