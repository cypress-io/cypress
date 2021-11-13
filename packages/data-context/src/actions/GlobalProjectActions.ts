import type { MutationAddProjectArgs } from '@packages/graphql/src/gen/nxs.gen'
import path from 'path'
import type { DataContext } from '..'

export class GlobalProjectActions {
  constructor (private ctx: DataContext) {}

  /**
   * Loads the projects for the "global mode", called when we start the app without
   * a project, or when we exit out to the global mode screen
   */
  async loadGlobalProjects () {
    this.ctx.debug('loadGlobalProjects from %s', this.ctx._apis.appDataApi.path())
    if (!this.ctx.coreData.isLoadingGlobalProjects) {
      this.ctx.coreData.isLoadingGlobalProjects = true
      try {
        this.ctx.coreData.globalProjects = await this.ctx._apis.projectApi.getProjectRootsFromCache()
        this.ctx.debug('loadGlobalProjects %o', this.ctx.coreData.globalProjects)
      } catch (e) {
        this.ctx.debug('loadGlobalProjects error %o', e)
        this.ctx.coreData.globalError = this.ctx.prepError(e as Error)
      } finally {
        this.ctx.coreData.isLoadingGlobalProjects = false
        this.ctx.emitter.toLaunchpad()
      }
    }
  }

  /**
   * Given a project "root" directory, sets as the active project directory
   * @param projectRoot
   * @returns
   */
  async setActiveProject (projectRoot: string) {
    this.ctx.debug('setActiveProject')
    await this.ctx.actions.currentProject?.clearCurrentProject()

    const title = this.ctx.project.projectTitle(projectRoot)

    // Set initial properties, so we can set the config object on the active project
    this.ctx.coreData.currentProject = {
      title,
      projectRoot,
      config: null,
      cliBrowser: null,
      currentTestingType: null,
      isLoadingConfig: false,
      isLoadingConfigPromise: null,
      isLoadingPlugins: false,
      errorLoadingConfig: null,
      errorLoadingPlugins: null,
    }

    // Load the project config, but don't block on this - it will alert
    // its status separately via updating coreData.currentProject
    this.ctx.actions.currentProject?.loadConfig()
  }

  /**
   * Adds a project directory to the list of "projects" if it doesn't exist already
   */
  async addProject (args: MutationAddProjectArgs) {
    const projectRoot = await this.getDirectoryPath(args.path)
    const found = this.ctx.projectsList?.find((x) => x.projectRoot === projectRoot)

    if (!found && this.ctx.coreData.globalProjects) {
      this.ctx.coreData.globalProjects.push(projectRoot)
      this.ctx._apis.projectApi.insertProjectToCache(projectRoot)
    }

    if (args.open) {
      await this.setActiveProject(projectRoot)
    }
  }

  removeProject (projectRoot: string) {
    const found = this.ctx.projectsList?.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      throw new Error(`Cannot remove ${projectRoot}, it is not a known project`)
    }

    this.ctx.coreData.globalProjects = this.ctx.coreData.globalProjects?.filter((project) => project !== projectRoot) ?? null
    this.ctx._apis.projectApi.removeProjectFromCache(projectRoot)
  }

  /**
   * Gets the directory path for a project root
   * @returns
   */
  private async getDirectoryPath (projectRoot: string) {
    try {
      const { dir, base } = path.parse(projectRoot)
      const fullPath = path.join(dir, base)
      const dirStat = await this.ctx.fs.stat(fullPath)

      if (dirStat.isDirectory()) {
        return fullPath
      }

      return dir
    } catch (exception) {
      throw Error(`Cannot add ${projectRoot} to projects as it does not exist in the file system`)
    }
  }
}
