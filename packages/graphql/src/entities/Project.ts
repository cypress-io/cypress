import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import { Config } from './Config'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  constructor (private _config: Config, private _ctx: BaseContext) {}

  @nxs.field.nonNull.type(() => Config)
  get config (): NxsResult<'Project', 'config'> {
    return this._config
  }

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return this.config.projectRoot
  }

  @nxs.field.nonNull.string()
  title (): NxsResult<'Project', 'title'> {
    return 'Title'
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  async description (): Promise<NxsResult<'Project', 'projectId'>> {
    return await this.ctx.actions.getProjectId(this.projectRoot)
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  async projectId (): Promise<NxsResult<'Project', 'projectId'>> {
    return await this.ctx.actions.getProjectId(this.projectRoot)
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this.config.projectRoot
  }

  get ctx () {
    return this._ctx
  }
}
