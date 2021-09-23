import type { FoundBrowser, FullConfig, LaunchOpts } from '@packages/types'
import type { DataContext } from '..'

export interface ProjectApiShape {
  getConfig(projectRoot: string): FullConfig
  launchProject(browser: FoundBrowser, spec: string, options: LaunchOpts): Promise<unknown>
  insertProject(projectRoot: string): void
}

export class ProjectActions {
  constructor (private ctx: DataContext, private api: ProjectApiShape) {}

  setActiveProject (projectRoot: string) {
    //
  }

  launchProject (browser: FoundBrowser, spec: string, options: LaunchOpts) {
    this.ctx.debug('launching with browser %o', browser)

    return this.api.launchProject(browser, spec, options)
  }

  createProject () {
    //
  }

  addProject (projectRoot: string) {
    const found = this.ctx.projectsList.find((x) => x.projectRoot === projectRoot)

    if (found) {
      return found
    }

    // const localProject = new Project(projectRoot, this.ctx)
    // this.ctx.localProjects.push(localProject)
    // insertProject(projectRoot)
    // return localProject
  }

  removeProject () {
    //
  }

  syncProjects () {
    //
  }

  createConfigFile () {
    //
  }
}
