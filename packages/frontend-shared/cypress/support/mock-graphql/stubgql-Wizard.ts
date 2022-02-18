import type { CodegenTypeMap, Wizard } from '../generated/test-graphql-types.gen'
import { BUNDLERS, CODE_LANGUAGES, COMPONENT_DEPS, FRONTEND_FRAMEWORKS } from '@packages/types/src/constants'
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
  packagesToInstall: [
    {
      ...testNodeId('WizardNpmPackage'),
      ...COMPONENT_DEPS.cypressReact,
    },
    {
      ...testNodeId('WizardNpmPackage'),
      ...COMPONENT_DEPS.cypressWebpackDevServer,
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
