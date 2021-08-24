import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import { ResolvedConfig } from './ResolvedConfig'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  constructor (private _projectRoot: string, protected ctx: BaseContext) {}

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return this.projectRoot
  }

  @nxs.field.nonNull.string()
  title (): NxsResult<'Project', 'title'> {
    return 'Title'
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  async projectId (): Promise<NxsResult<'Project', 'projectId'>> {
    return await this.ctx.actions.getProjectId(this.projectRoot)
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this._projectRoot
  }

  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'Project', 'resolvedConfig'> {
    const cfg = this.ctx.actions.resolveOpenProjectConfig()

    if (!cfg) {
      throw Error('openProject.getConfig is null. Have you initialized the current project?')
    }

    return new ResolvedConfig(cfg.resolved)
  }
}
