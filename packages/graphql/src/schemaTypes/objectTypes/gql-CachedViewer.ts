import dedent from 'dedent'
import { objectType } from 'nexus'

export const CachedViewer = objectType({
  name: 'CachedViewer',
  description: dedent`
    When a user does not have internet connection, we still have their "cached" identifier.
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
