import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { Project } from './Project'
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

  @nxs.field.nonNull.list.nonNull.type(() => Project, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'App', 'projects'> {
    return this.ctx.projects
  }

  @nxs.field.type(() => Project, {
    description: 'The active project in the app',
  })
  get activeProject (): NxsResult<'App', 'activeProject'> {
    return this.projects.find((p) => p.isCurrent) ?? null
  }

  @nxs.field.type(() => User, {
    description: 'Cypress Cloud',
  })
  get user (): NxsResult<'App', 'user'> {
    return this.ctx.user ?? null
  }
}
