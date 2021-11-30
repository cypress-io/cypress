import dedent from 'dedent'
import type { Query } from '../generated/test-graphql-types.gen'
import { MaybeResolver, testNodeId } from './clientTestUtils'

export const stubQuery: MaybeResolver<Query> = {
  __typename: 'Query',
  warnings: [],
  dev () {
    return {}
  },
  localSettings (source, args, ctx) {
    return ctx.localSettings
  },
  currentProject (source, args, ctx) {
    return ctx.currentProject
  },
  projects (source, args, ctx) {
    return ctx.projects
  },
  versions (source, args, ctx) {
    return ctx.versions
  },
  isAuthBrowserOpened (source, args, ctx) {
    return ctx.isAuthBrowserOpened
  },
  isInGlobalMode (source, args, ctx) {
    return !ctx.currentProject
  },
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
}
