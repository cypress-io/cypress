import dedent from 'dedent'
import { objectType } from 'nexus'

export const CachedViewer = objectType({
  name: 'CachedViewer',
  description: dedent`
    When a user does not have internet connection, we still have their "cached" identifier.
  `,
  node: 'email',
  definition (t) {
    t.string('name', {
      description: 'Name of the cached user',
    })

    t.string('email', {
      description: 'Email address of the cached user',
    })
  },
})
