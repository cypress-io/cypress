import { nonNull, stringArg } from "nexus";
import { nxs, NxsResult } from "nexus-decorators";
import type { BaseContext } from "../context/BaseContext";
import type { NexusGenArgTypes } from "../gen/nxs.gen";
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

  // @nxs.field.nullable.type(() => DashboardProject, {
  @nxs.field.nullable.type(() => DashboardProject, {
    description: 'Active project',
    args: {
      projectId: nonNull(stringArg())
    }
  })
  getProjectByProjectId ({ projectId }: NexusGenArgTypes['Viewer']['getProjectByProjectId']): NxsResult<'Viewer', 'getProjectByProjectId'> {
    if (!this.config?.authToken) {
      return null
    }

    const project = this.ctx.localProjects.find(async p => {
      return await p.projectId() === projectId
    })

    if (!project) {
      return null
    }

    return new DashboardProject(project.config, this.ctx, this.authToken!)
  }

  @nxs.field.list.nullable.type(() => DashboardProject, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'Viewer', 'projects'> {
    if (!this.authToken) {
      return null
    }

    return this.ctx.localProjects.map(p => 
      new DashboardProject(p.config, this.ctx, this.authToken!))
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