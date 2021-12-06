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

    await this.ctx.loadingManager.globalProjects.load()
  }

  /**
   * Given a project "root" directory, sets as the active project directory
   * @param projectRoot
   * @returns
   */
  async setAndLoadActiveProject (projectRoot: string) {
    await this.ctx.actions.currentProject?.clearCurrentProject()

    // Set initial properties, so we can set the config object on the active project
    this.ctx.setCurrentProject(projectRoot)

    if (this.ctx.currentProject?.configFile) {
      // Load the project config, but don't block on this - it will alert
      // its status separately via updating coreData.currentProject
      this.ctx.loadingManager.projectConfig.load().finally(() => {
        // Trigger the launchpad to re-render
        this.ctx.emitter.toLaunchpad()
      })
    }
  }

  setActiveProjectForTestSetup (projectRoot: string) {
    // Set initial properties, so we can set the config object on the active project
    this.ctx.setCurrentProject(projectRoot)
  }

  /**
   * Adds a project directory to the list of "projects" if it doesn't exist already
   */
  async addProject (args: MutationAddProjectArgs) {
    const projectList = await this.ctx.loadingManager.globalProjects.load()
    const projectRoot = await this.getDirectoryPath(args.path)
    const found = projectList?.find((x) => x === projectRoot)

    if (!found) {
      this.ctx.update((s) => {
        if (s.globalProjects.state === 'LOADED') {
          s.globalProjects.value.push(projectRoot)
        }
      })

      this.ctx._apis.projectApi.insertProjectToCache(projectRoot)
    }

    if (args.open) {
      await this.setAndLoadActiveProject(projectRoot)
    }
  }

  removeProject (projectRoot: string) {
    const found = this.ctx.projectsList?.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      throw new Error(`Cannot remove ${projectRoot}, it is not a known project`)
    }

    this.ctx.update((s) => {
      if (s.globalProjects.state === 'LOADED') {
        s.globalProjects.value = s.globalProjects.value.filter((project) => project !== projectRoot) ?? null
      }
    })

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
