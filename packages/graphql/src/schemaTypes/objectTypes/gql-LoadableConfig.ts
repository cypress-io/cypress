import { objectType } from 'nexus'

export const LoadableConfig = objectType({
  name: 'LoadableConfig',
  definition (t) {
    t.implements('Loadable')
  },
})
