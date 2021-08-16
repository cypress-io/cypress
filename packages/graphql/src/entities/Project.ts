import { nxs, NxsResult } from 'nexus-decorators'
import type { ProjectContract } from '../contracts/ProjectContract'
import { Config } from './Config'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  constructor (private meta: { config: Config }) {}

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return this.meta.config.projectRoot
  }

  @nxs.field.nonNull.string()
  title (): NxsResult<'Project', 'title'> {
    return 'Title'
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  projectId (): NxsResult<'Project', 'projectId'> {
    // TODO: Dynamic
    return 'ypt4pf'
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this.config.projectRoot
  }

  @nxs.field.nonNull.type(() => Config)
  get config (): NxsResult<'Project', 'config'> {
    return this.meta.config
  }
}
