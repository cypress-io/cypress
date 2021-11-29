import { interfaceType } from 'nexus'

export const Loadable = interfaceType({
  name: 'Loadable',
  description: 'A loadable can be in a loading state, before being a resolved value',
  definition (t) {
    t.nonNull.boolean('status')
    t.boolean('error')
  },
  resolveType (o) {
    return o.__typename
  },
})
