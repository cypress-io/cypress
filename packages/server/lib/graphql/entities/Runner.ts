import { mutationField } from 'nexus'
import { projects } from '../../projects'
import { Project } from './types'
import { formatProject } from '../utils'

export const LaunchRunner = mutationField((t) => {
  t.nonNull.field('launchRunner', {
    type: Project,
    async resolve (_root, args, ctx) {
      // TODO: should we await here, or return a pending state to the client?
      await projects.launchRunner()

      return formatProject(projects.openProject!)
    },
  })
})

export const CloseRunner = mutationField((t) => {
  t.nonNull.field('closeRunner', {
    type: Project,
    async resolve (_root, args, ctx) {
      // TODO: should we await here, or return a pending state to the client?
      await projects.closeRunner()

      return formatProject(projects.openProject!)
    },
  })
})
