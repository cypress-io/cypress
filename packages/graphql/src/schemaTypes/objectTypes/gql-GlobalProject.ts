import { objectType } from 'nexus'

export const GlobalProject = objectType({
  name: 'GlobalProject',
  description: 'A project which exists on the filesystem but has not been opened',
  node: 'projectRoot',
  definition (t) {
    t.implements('ProjectLike')
  },
})
