import { interfaceType } from 'nexus'
import assert from 'assert'

export const Node = interfaceType({
  name: 'Node',
  description: 'Implements the Relay Node spec',
  definition (t) {
    t.nonNull.id('id', {
      description: 'Globally unique identifier representing a concrete GraphQL ObjectType',
      resolve: (source) => {
        throw new Error('Abstract resolve, should be handled separately')
      },
    })
  },
  resolveType: (t: any) => {
    if (!t.__typename) {
      assert(t.__typename, `Cannot resolve Node without __typename: saw ${String(t)}`)
    }

    return t.__typename
  },
})
