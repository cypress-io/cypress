import type { CodegenTypeMap, Wizard } from '../generated/test-graphql-types.gen'
import { CODE_LANGUAGES } from '@packages/types/src/constants'
import { BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import * as wizardDeps from '@packages/scaffold-config/src/dependencies'
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
      __typename: 'WizardNpmPackage',
      id: 'cra',
      satisfied: true,
      ...wizardDeps.WIZARD_DEPENDENCY_REACT_SCRIPTS,
    },
    {
      __typename: 'WizardNpmPackage',
      id: 'typescript',
      satisfied: false,
      detectedVersion:'2.0.1',
      ...wizardDeps.WIZARD_DEPENDENCY_TYPESCRIPT,
    },
  ],
  allBundlers,
  frameworks: WIZARD_FRAMEWORKS.map((framework, idx) => {
    return {
      ...testNodeId('WizardFrontendFramework'),
      ...framework,
      supportedBundlers: framework.supportedBundlers as unknown as Array<CodegenTypeMap['WizardBundler']>,
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
