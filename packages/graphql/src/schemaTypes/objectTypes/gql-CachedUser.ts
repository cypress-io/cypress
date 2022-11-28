import dedent from 'dedent'
import { objectType } from 'nexus'

export const CachedUser = objectType({
  name: 'CachedUser',
  description: dedent`
    When we don't have an immediate response for the cloudViewer request, we'll use this as a fallback to 
    render the avatar in the header bar / signal authenticated state immediately
  `,
  node: 'email',
  definition (t) {
    t.string('fullName', {
      description: 'Name of the cached user',
      resolve: (source) => source.name ?? null,
    })

    t.string('email', {
      description: 'Email address of the cached user',
    })
  },
  sourceType: {
    export: 'AuthenticatedUserShape',
    module: '@packages/data-context/src/data/coreDataShape',
  },
})
