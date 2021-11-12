import type { CodegenTypeMap, Wizard } from '../generated/test-graphql-types.gen'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS } from '@packages/types/src/constants'
import { MaybeResolver, testNodeId } from './clientTestUtils'
import dedent from 'dedent'

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
  sampleConfigFiles: [
    {
      ...testNodeId('WizardSampleConfigFile'),
      filePath: 'cypress.config.ts',
      description: 'The proper config file',
      content: dedent`import { startDevServer } from '@cypress/vite-dev-server'

                      /* This is some test data. It does not need to be valid code. */
            `,
      status: 'valid',
    },
    {
      ...testNodeId('WizardSampleConfigFile'),
      filePath: 'cypress/fixtures/example.json',
      description: 'Please do the necessary changes to your file',
      content: dedent`{ 
        "foo": 1,
        "bar": 42
      }`,
      status: 'changes',
    },
    {
      ...testNodeId('WizardSampleConfigFile'),
      filePath: 'cypress/component/support.ts',
      description: 'Please do the necessary changes to your file',
      content: dedent`import { startDevServer } from '@cypress/vite-dev-server'

                      /* This is some test data. It does not need to be valid code. */
                      `,
      status: 'skipped',
    },
    {
      ...testNodeId('WizardSampleConfigFile'),
      filePath: 'cypress/component/commands.ts',
      description: 'Please do the necessary changes to your file',
      content: dedent`import { startDevServer } from '@cypress/vite-dev-server'

      /* This is some test data. It does not need to be valid code. */`,
      status: 'error',
    },
  ],
  currentTestingTypePluginsInitialized: false,
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
