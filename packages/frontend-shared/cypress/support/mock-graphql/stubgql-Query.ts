import type { Query } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'

export const stubQuery: MaybeResolver<Query> = {
  __typename: 'Query',
  dev () {
    return {}
  },
  app (source, args, ctx) {
    return ctx.app
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
}
