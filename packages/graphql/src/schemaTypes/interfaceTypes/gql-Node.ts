import { interfaceType } from 'nexus'

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
  resolveType: (t) => {
    if (t.__typename) {
      return t.__typename
    }

    return t.id
  },
})
