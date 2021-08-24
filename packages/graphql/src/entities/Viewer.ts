import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { Project } from './Project'

export interface AuthenticatedUser {
  name: string
  email: string
  authToken: string
}

@nxs.objectType({
  description: 'Namespace for information related to the viewer',
})
export class Viewer {
  constructor (private ctx: BaseContext, private viewer: AuthenticatedUser) {}

  @nxs.field.list.nullable.type(() => Project, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'Viewer', 'projects'> {
    if (!this.authToken) {
      return null
    }

    return this.ctx.localProjects.map((p) => {
      return new Project(p.projectRoot, this.ctx)
    })
  }

  @nxs.field.nonNull.string()
  get name (): NxsResult<'Viewer', 'name'> {
    return this.viewer.name
  }

  @nxs.field.nonNull.string()
  get email (): NxsResult<'Viewer', 'email'> {
    return this.viewer.email
  }

  @nxs.field.nonNull.string()
  get authToken (): NxsResult<'Viewer', 'authToken'> {
    return this.viewer.authToken
  }
}
