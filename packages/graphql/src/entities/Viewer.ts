import { nxs, NxsResult } from "nexus-decorators";
import type { BaseContext } from "../context/BaseContext";
import { DashboardProject } from "./DashboardProject";

export interface AuthenticatedUser {
  name: string
  email: string
  authToken: string
}

@nxs.objectType({
  description: 'Namespace for information related to the viewer',
})
export class Viewer {
  constructor (private ctx: BaseContext, private config?: AuthenticatedUser) {}

  setAuthenticatedConfig (config: AuthenticatedUser | undefined) {
    this.config = config
  }

  @nxs.field.nonNull.list.nonNull.type(() => DashboardProject, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'Viewer', 'projects'> {
    return this.ctx.localProjects.map(p => 
      new DashboardProject(p.config, this.ctx, this))
  }

  @nxs.field.nonNull.boolean()
  get authenticated (): NxsResult<'Viewer', 'authenticated'> {
    return !!this.config?.authToken
  }

  @nxs.field.string()
  get name (): NxsResult<'Viewer', 'name'> {
    return this.config?.name ?? null
  }

  @nxs.field.string()
  get email (): NxsResult<'Viewer', 'email'> {
    return this.config?.email ?? null
  }

  @nxs.field.string()
  get authToken (): NxsResult<'Viewer', 'authToken'> {
    return this.config?.authToken ?? null
  }
}