import { objectType } from 'nexus'

export const LoadableProjectConfig = objectType({
  name: 'LoadableProjectConfig',
  description: 'A "loadable" for sourcing the Project Config',
  definition (t) {
    t.implements('Loadable')
    t.json('config')
  },
})
