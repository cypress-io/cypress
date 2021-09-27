import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'
import { BUNDLERS, FRONTEND_FRAMEWORKS, TESTING_TYPES } from '@packages/types/src/constants'
import { testNodeId } from './testUtils'

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export const wizard: CodegenTypeMap['Wizard'] = {
  __typename: 'Wizard',
  canNavigateForward: true,
  step: 'welcome',
  isManualInstall: false,
  allBundlers: BUNDLERS.map((bundler) => {
    return {
      ...testNodeId('WizardBundler'),
      ...bundler,
    }
  }),
  chosenTestingTypePluginsInitialized: false,
  testingTypes: (TESTING_TYPES as Writeable<typeof TESTING_TYPES>).map((type) => {
    return {
      ...testNodeId('TestingTypeInfo'),
      ...type,
    }
  }),
  frameworks: FRONTEND_FRAMEWORKS.map((framework) => {
    // get around readonly errors
    const supportedBundlers = framework.supportedBundlers as unknown as Array<CodegenTypeMap['WizardBundler']>

    return {
      ...testNodeId('WizardFrontendFramework'),
      ...framework,
      supportedBundlers,
      isSelected: false,
    }
  }),
}
