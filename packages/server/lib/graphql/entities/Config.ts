import { queryField } from 'nexus'
import { Config } from './types'
import { projects } from '../../projects'

export const config = queryField((t) => {
  t.nonNull.field('config', {
    type: Config,
    resolve (_root, args, ctx) {
      if (!projects.openProject) {
        return {}
      }

      return projects.openProject.getConfig()
    },
  })
})
