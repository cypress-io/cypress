import type { CodegenTypeMap, Wizard } from '../generated/test-graphql-types.gen'
import { CODE_LANGUAGES } from '@packages/types/src/constants'
import { BUNDLERS, CYPRESS_REACT_LATEST, CYPRESS_WEBPACK, FRONTEND_FRAMEWORKS } from '@packages/scaffold-config'
import type { MaybeResolver } from './clientTestUtils'
import { testNodeId } from './clientTestUtils'

export const allBundlers = BUNDLERS.map((bundler, idx) => {
  return {
    ...testNodeId('WizardBundler'),
    isSelected: idx === 0,
    isDetected: false,
    ...bundler,
  }
})

export const stubWizard: MaybeResolver<Wizard> = {
  __typename: 'Wizard',
  installDependenciesCommand: 'npm install -D @cypress/react @cypress/webpack-dev-server',
  packagesToInstall: [
    {
      ...testNodeId('WizardNpmPackage'),
      ...CYPRESS_REACT_LATEST,
    },
    {
      ...testNodeId('WizardNpmPackage'),
      ...CYPRESS_WEBPACK,
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
      isDetected: false,
    }
  }),
  language: {
    ...testNodeId('WizardCodeLanguage'),
    type: 'ts',
    name: 'TypeScript',
    isSelected: true,
    isDetected: false,
  },
  allLanguages: CODE_LANGUAGES.map((language, idx) => {
    return {
      ...testNodeId('WizardCodeLanguage'),
      ...language,
      isSelected: idx === 0,
      isDetected: false,
    }
  }),
}
