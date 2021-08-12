import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { LocalProject } from './LocalProject'

@nxs.objectType({
  description: 'Namespace for information related to the app',
})
export class App {
  constructor (private ctx: BaseContext) {}

  @nxs.field.nonNull.boolean({
    description: 'Whether this is the first open of the application or not',
  })
  static get isFirstOpen (): NxsResult<'App', 'isFirstOpen'> {
    return true
  }

  @nxs.field.type(() => LocalProject, {
    description: 'Active project',
  })
  get activeProject (): NxsResult<'App', 'activeProject'> {
    return this.ctx.localProjects[0]!
  }

  @nxs.field.nonNull.list.nonNull.type(() => LocalProject, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'App', 'projects'> {
    return this.ctx.localProjects
  }
}
