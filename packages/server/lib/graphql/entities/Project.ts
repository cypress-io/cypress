// import { createHash } from 'crypto'
import { objectType } from 'nexus'
import { nxs, NxsResult } from 'nexus-decorators'
import { PluginsStateEnum } from '../constants/ProjectConstants'
import { ProjectBaseContract } from '../contracts/ProjectBaseContract'

export interface ProjectConfig {
  projectRoot: string
  projectBase: ProjectBaseContract
}

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project {
  constructor (private config: ProjectConfig) {}

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return '1'
    // return createHash('sha1').update(this.projectRoot).digest('hex')
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this.config.projectRoot
  }

  @nxs.field.nonNull.boolean()
  get isOpen (): NxsResult<'Project', 'isOpen'> {
    return this.config.projectBase.isOpen
  }

  @nxs.field.nonNull.boolean()
  isCurrent (): NxsResult<'Project', 'isCurrent'> {
    return false
  }

  @nxs.field.nonNull.list.nonNull.boolean()
  plugins (): NxsResult<'Project', 'plugins'> {
    return []
  }

  @nxs.field.nonNull.type(() => InitPluginsStatus)
  pluginStatus (): NxsResult<'Project', 'pluginStatus'> {
    return this
  }
}

export const InitPluginsStatus = objectType({
  name: 'InitPluginsStatus',
  definition (t) {
    t.nonNull.field('state', {
      type: PluginsStateEnum,
    }),
    t.string('message')
  },
})
