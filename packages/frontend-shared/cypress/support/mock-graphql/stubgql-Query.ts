import type { Query } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'

export const stubQuery: MaybeResolver<Query> = {
  __typename: 'Query',
  dev () {
    return {}
  },
  wizard (source, args, ctx) {
    return ctx.wizard
  },
  currentProject (source, args, ctx) {
    return ctx.currentProject
  },
  projects (soruce, args, ctx) {
    return ctx.projects
  },
  isAuthBrowserOpened (source, args, ctx) {
    return ctx.isAuthBrowserOpened
  },
  isInGlobalMode (source, args, ctx) {
    return !ctx.currentProject
  },
}
