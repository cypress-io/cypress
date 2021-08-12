import { nxs, NxsResult } from 'nexus-decorators'
import { ProjectBase } from '../../../server/lib/project-base'
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

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud'
  })
  async projectId (): Promise<NxsResult<'Project', 'projectId'>> {
    const base = new ProjectBase({ 
      projectRoot: this.meta.config.projectRoot,
      testingType: 'e2e',
      options: {}
    })
    return await base.getProjectId()
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
