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
  migration (source, args, ctx) {
    return ctx.migration
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
  authState (source, args, ctx) {
    return ctx.authState
  },
  isGlobalMode () {
    return false
  },
  invokedFromCli (source, args, ctx) {
    return true
  },
  baseError (source, args, ctx) {
    return {}
  },
  warnings () {
    return []
  },
  scaffoldedFiles () {
    return null
  },
}
