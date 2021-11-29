import { objectType } from 'nexus'

export const LoadablePlugins = objectType({
  name: 'LoadablePlugins',
  definition (t) {
    t.implements('Loadable')
  },
})
