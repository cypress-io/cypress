import type { MutationAppCreateConfigFileArgs, SpecType } from '@packages/graphql/src/gen/nxs.gen'
import type { FindSpecs, FoundBrowser, FoundSpec, FullConfig, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions } from '@packages/types'
import path from 'path'
import type { Maybe } from '../data/coreDataShape'

import type { DataContext } from '..'

export interface ProjectApiShape {
  getConfig(projectRoot: string): Promise<FullConfig>
  findSpecs(payload: FindSpecs): Promise<FoundSpec[]>
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

  async setActiveProject (projectRoot: string) {
    this.ctx.coreData.app.activeProject = {
      projectRoot,
      title: '',
      ctPluginsInitialized: false,
      e2ePluginsInitialized: false,
      isFirstTimeCT: await this.ctx.project.isFirstTimeAccessing(projectRoot, 'component'),
      isFirstTimeE2E: await this.ctx.project.isFirstTimeAccessing(projectRoot, 'e2e'),
    }

    return this
  }

  async findSpecs (projectRoot: string, specType: Maybe<SpecType>) {
    const config = await this.ctx.loaders.projectConfig(projectRoot)
    const specs = await this.api.findSpecs({
      projectRoot,
      fixturesFolder: config.fixturesFolder ?? false,
      supportFile: config.supportFile ?? false,
      testFiles: config.testFiles ?? [],
      ignoreTestFiles: config.ignoreTestFiles as string[] ?? [],
      componentFolder: config.componentFolder ?? false,
      integrationFolder: config.integrationFolder ?? '',
    })

    if (!specType) {
      return specs
    }

    return specs.filter((spec) => spec.specType === specType)
  }

  async initializeActiveProject () {
    if (!this.ctx.activeProject || !this.ctx.wizardData.chosenTestingType) {
      throw Error('Cannot initialize project without an active project')
    }

    if (!this.ctx.wizardData.chosenTestingType) {
      throw Error('Cannot initialize project without choosing testingType')
    }

    const browsers = [...(this.ctx.browserList ?? [])]

    await this.api.initializeProject(
      { ...this.ctx.launchArgs, testingType: this.ctx.wizardData.chosenTestingType }, this.ctx.launchOptions, browsers,
    )
  }

  createProject () {
    //
  }

  async addProject (projectRoot: string) {
    const found = this.ctx.projectsList.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      this.ctx.coreData.app.projects.push({ projectRoot })
    }

    await this.setActiveProject(projectRoot)
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
