import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { LocalProject } from './LocalProject'
import { User } from './User'

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

  @nxs.field.nonNull.list.nonNull.type(() => LocalProject, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'App', 'projects'> {
    return this.ctx.localProjects
  }

  @nxs.field.type(() => User, {
    description: 'Cypress Cloud',
  })
  get user (): NxsResult<'App', 'user'> {
    return this.ctx.user ?? null
  }
}
