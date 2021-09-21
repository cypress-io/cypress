import type { IProjectSource, Project } from '@packages/graphql'
import type { ServerContext } from './ServerContext'
import { getProjectRoots } from '@packages/server/lib/cache'

export class ProjectSource implements IProjectSource {
  localProjects: Project[]
  activeProject: Project | null

  constructor (protected ctx: ServerContext) {
    this.localProjects = []
    this.activeProject = null
  }

  async loadProjects () {
    const cachedProjects = await this._loadProjectsFromCache()

    cachedProjects.forEach((projectRoot) => {
      this.ctx.actions.project.addProject(projectRoot)
    })

    return this.ctx.app.projects
  }

  async _loadProjectsFromCache () {
    return await getProjectRoots()
  }
}
