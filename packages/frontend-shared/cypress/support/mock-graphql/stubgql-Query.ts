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
  videoEmbedHtml () {
    return `<iframe
      src="https://player.vimeo.com/video/855168407?h=0cbc785eef"
      title="Video about what is new in Cypress"
      class="rounded h-full bg-gray-1000 w-full"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    />`
  },
}
