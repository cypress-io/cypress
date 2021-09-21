import { IProjectActions, Project } from '@packages/graphql'
import type { ServerContext } from './ServerContext'
import { insertProject } from '@packages/server/lib/cache'

export class ProjectActions implements IProjectActions {
  constructor (protected ctx: ServerContext) { }

  addProject (projectRoot: string) {
    // no need to re-add
    const found = this.ctx.project.localProjects.find((x) => x.projectRoot === projectRoot)

    if (found) {
      return found
    }

    const localProject = new Project(projectRoot, this.ctx)

    this.ctx.project.localProjects.push(localProject)
    insertProject(projectRoot)

    return localProject
  }

  setActiveProject (project: Project): Project {
    this.ctx.project.activeProject = project

    return this.ctx.project.activeProject
  }
}
