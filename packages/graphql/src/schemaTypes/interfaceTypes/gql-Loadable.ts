import { interfaceType } from 'nexus'
import { Warning } from '..'

export const Loadable = interfaceType({
  name: 'Loadable',
  description: 'A loadable can be in a loading state, before being a resolved value',
  definition (t) {
    t.nonNull.boolean('status')
    t.boolean('error')
    t.field('warning', {
      type: Warning,
      description: `A warning associated with the current asynchronous action, e.g. if an invalid browser is found`,
    })
  },
  resolveType (o) {
    return o.__typename
  },
})
