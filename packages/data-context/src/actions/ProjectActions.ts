import type { FoundBrowser, FullConfig, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions } from '@packages/types'
import type { DataContext } from '..'

export interface ProjectApiShape {
  getConfig(projectRoot: string): Promise<FullConfig>
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   */
  initializeProject(args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: FoundBrowser[]): Promise<unknown>
  launchProject(browser: FoundBrowser, spec: string, options: LaunchOpts): Promise<unknown>
  insertProject(projectRoot: string): void
}

export class ProjectActions {
  constructor (private ctx: DataContext, private api: ProjectApiShape) {}

  setActiveProject (projectRoot: string) {
    this.ctx.coreData.app.activeProject = {
      projectRoot,
      ctPluginsInitialized: false,
      e2ePluginsInitialized: false,
      isFirstTimeCT: false,
      isFirstTimeE2E: false,
    }

    return this
  }

  initializeActiveProject () {
    // await openProject.create(args.projectRoot, args, options, browsers)
    // if (!this.ctx.activeProject) {
    //   throw Error('Cannot initialize project without an active project')
    // }

    // if (args.testingType === 'e2e') {
    //   this.ctx.activeProject.setE2EPluginsInitialized(true)
    // }

    // if (args.testingType === 'component') {
    //   this.ctx.activeProject.setCtPluginsInitialized(true)
    // }
  }

  launchProject () {
    // this.ctx.debug('launching with browser %o', browser)

    // const browser = this.ctx.appData.browsers?.find((x) => x.name === 'chrome')

    // if (!browser) {
    //   throw Error(`Could not find chrome browser`)
    // }

    // const spec: Cypress.Spec = {
    //   name: '',
    //   absolute: '',
    //   relative: '',
    //   specType: ctx.wizardData.chosenTestingType === 'e2e' ? 'integration' : 'component',
    // }

    // await ctx.actions.launchOpenProject(browser.config, spec, {})

    // // ctx.actions.project.launchProject()

    // return this.api.launchProject(browser, spec, options)
  }

  createProject () {
    //
  }

  addProject (projectRoot: string) {
    const found = this.ctx.projectsList.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      this.ctx.coreData.app.projects.push({ projectRoot })
    }

    this.setActiveProject(projectRoot)
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
