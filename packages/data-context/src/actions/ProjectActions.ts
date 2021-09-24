import type { MutationAppCreateConfigFileArgs } from '@packages/graphql/src/gen/nxs.gen'
import type { FoundBrowser, FullConfig, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions } from '@packages/types'
import path from 'path'

import type { DataContext } from '..'

export interface ProjectApiShape {
  getConfig(projectRoot: string): Promise<FullConfig>
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  initializeProject(args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: FoundBrowser[]): Promise<unknown>
  launchProject(browser: FoundBrowser, spec: Cypress.Spec, options: LaunchOpts): void
  insertProject(projectRoot: string): void
}

export class ProjectActions {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

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

  async initializeActiveProject () {
    if (!this.ctx.activeProject || !this.ctx.wizardData.chosenTestingType) {
      throw Error('Cannot initialize project without an active project')
    }

    const browsers = [...(this.ctx.browserList ?? [])]

    await this.api.initializeProject({
      ...this.ctx.launchArgs,
      testingType: this.ctx.wizardData.chosenTestingType,
    }, this.ctx.launchOptions, browsers)
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

  async launchProject () {
    const browser = this.ctx.wizardData.chosenBrowser ?? this.ctx.appData.browsers?.[0]

    if (!browser) {
      throw Error(`Could not find browser`)
    }

    const spec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: this.ctx.wizardData.chosenTestingType === 'e2e' ? 'integration' : 'component',
    }

    return this.api.launchProject(browser, spec, {})
  }

  removeProject () {
    //
  }

  syncProjects () {
    //
  }

  createConfigFile (args: MutationAppCreateConfigFileArgs) {
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot create config file without activeProject.`)
    }

    this.ctx.fs.writeFileSync(path.resolve(project.projectRoot, args.configFilename), args.code)
  }
}
