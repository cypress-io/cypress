import type { Query } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'
// import dedent from 'dedent'

export const stubQuery: MaybeResolver<Query> = {
  __typename: 'Query',
  dev () {
    return {}
  },
  localSettings (source, args, ctx) {
    return ctx.localSettings
  },
  wizard (source, args, ctx) {
    return ctx.wizard
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
  baseError (source, args, ctx) {
    return {}
  },
  warnings () {
    return []
  },
  scaffoldedFiles () {
    // return [
    //   {
    //     filePath: 'cypress.config.ts',
    //     description: 'The proper config file',
    //     content: dedent`import { startDevServer } from '@cypress/vite-dev-server'

    //                     /* This is some test data. It does not need to be valid code. */
    //           `,
    //     status: 'valid',
    //   },
    //   {
    //     filePath: 'cypress/fixtures/example.json',
    //     description: 'Please do the necessary changes to your file',
    //     content: dedent`{
    //       "foo": 1,
    //       "bar": 42
    //     }`,
    //     status: 'changes',
    //   },
    //   {
    //     filePath: 'cypress/component/support.ts',
    //     description: 'Please do the necessary changes to your file',
    //     content: dedent`import { startDevServer } from '@cypress/vite-dev-server'

    //                     /* This is some test data. It does not need to be valid code. */
    //                     `,
    //     status: 'skipped',
    //   },
    //   {
    //     filePath: 'cypress/component/commands.ts',
    //     description: 'Please do the necessary changes to your file',
    //     content: dedent`import { startDevServer } from '@cypress/vite-dev-server'

    //     /* This is some test data. It does not need to be valid code. */`,
    //     status: 'error',
    //   },
    // ],
    return null
  },
}
