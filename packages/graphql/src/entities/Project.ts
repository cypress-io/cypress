import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  constructor (private _projectRoot: string, protected ctx: BaseContext) {}

  @nxs.field.nonNull.id()
  id (): NxsResult<'LocalProject', 'id'> {
    return this.projectRoot
  }

  @nxs.field.nonNull.string()
  title (): NxsResult<'LocalProject', 'title'> {
    return 'Title'
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  async projectId (): Promise<NxsResult<'LocalProject', 'projectId'>> {
    return await this.ctx.actions.getProjectId(this.projectRoot)
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'LocalProject', 'projectRoot'> {
    return this._projectRoot
  }
}
