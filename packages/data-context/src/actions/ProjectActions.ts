import type { CodeGenType, MutationAddProjectArgs, MutationSetProjectPreferencesArgs, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { FindSpecs, FoundBrowser, FoundSpec, FullConfig, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions, Preferences, SettingsOptions } from '@packages/types'
import path from 'path'
import type { DataContext } from '..'
import { codeGenerator, SpecOptions } from '../codegen'
import templates from '../codegen/templates'

export interface ProjectApiShape {
  getConfig(projectRoot: string, options?: SettingsOptions): Promise<FullConfig>
  findSpecs(payload: FindSpecs): Promise<FoundSpec[]>
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  initializeProject(args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: FoundBrowser[]): Promise<unknown>
  launchProject(browser: FoundBrowser, spec: Cypress.Spec, options: LaunchOpts): void
  insertProjectToCache(projectRoot: string): void
  removeProjectFromCache(projectRoot: string): void
  getProjectRootsFromCache(): Promise<string[]>
  insertProjectPreferencesToCache(projectTitle: string, preferences: Preferences): void
  getProjectPreferencesFromCache(): Promise<Record<string, Preferences>>
  clearLatestProjectsCache(): Promise<unknown>
  clearProjectPreferences(projectTitle: string): Promise<unknown>
  clearAllProjectPreferences(): Promise<unknown>
  closeActiveProject(): Promise<unknown>
  error(type: string, ...args: any): Error
}

export class ProjectActions {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearCurrentTestingType () {
    await this.api.closeActiveProject()
    if (!this.ctx.currentProject) {
      return
    }

    this.ctx.currentProject.currentTestingType = null
  }

  async clearCurrentProject () {
    await this.api.closeActiveProject()

    // TODO(tim): Improve general state management w/ immutability (immer) & updater fn
    this.ctx.coreData.currentProject = null
  }

  private get projects () {
    return this.ctx.coreData.app.projects
  }

  private set projects (projects: string[]) {
    this.ctx.coreData.app.projects = projects
  }

  /**
   * Given a project "root" directory, sets as the active project directory
   * @param projectRoot
   * @returns
   */
  async setActiveProject (projectRoot: string) {
    await this.clearCurrentProject()

    const title = this.ctx.project.projectTitle(projectRoot)

    // Set initial properties, so we can set the config object on the active project
    this.ctx.coreData.currentProject = {
      title,
      projectRoot,
      currentTestingType: null,
      isLoadingConfig: true,
      configPromise: null,
      errorLoadingConfig: null,
      config: null,
    }

    // Load the project config, but don't block on this - it will alert
    // its status separately via updating coreData.currentProject
    return this.loadConfigForProject(projectRoot)
  }

  setCurrentTestingType (type: TestingTypeEnum) {
    if (this.ctx.currentProject) {
      this.ctx.currentProject.currentTestingType = type
    }

    return null
  }

  async loadGlobalProjects () {
    const projects = this.api.getProjectRootsFromCache()

    this.ctx.coreData.app.projects = await projects
  }

  /**
   * Starts the plugins for a given project, and launches
   * the development server if we are in component testing mode
   */
  async initializeActiveProject () {
    if (!this.ctx.currentProject) {
      throw Error('Cannot initialize project without an active project')
    }

    if (!this.ctx.currentProject.currentTestingType) {
      throw Error('Cannot initialize project without choosing testingType')
    }

    // Ensure that we have loaded browsers to choose from
    if (this.ctx.appData.refreshingBrowsers) {
      await this.ctx.appData.refreshingBrowsers
    }

    const browsers = [...(this.ctx.browserList ?? [])]

    const launchArgs: LaunchArgs = {
      ...this.ctx.launchArgs,
      projectRoot: this.ctx.currentProject.projectRoot,
      testingType: this.ctx.currentProject.currentTestingType,
    }

    try {
      await this.api.closeActiveProject()
      await this.api.initializeProject(launchArgs, {
        ...this.ctx.launchOptions,
        ctx: this.ctx,
      }, browsers)
    } catch (e) {
      this.ctx.logError(e)
      throw e
    }
  }

  createProject () {
    //
  }

  async addProject (args: MutationAddProjectArgs) {
    const projectRoot = await this.getDirectoryPath(args.path)

    const found = this.ctx.projectsList.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      this.projects.push(projectRoot)
      this.api.insertProjectToCache(projectRoot)
    }

    if (args.open) {
      await this.setActiveProject(projectRoot)
    }
  }

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

  /**
   * Launches the project in the browser, based on the current testing type
   * @param options
   * @returns
   */
  async launchProject (options: LaunchOpts) {
    const currentTestingType = this.ctx.currentProject?.currentTestingType

    if (!this.ctx.currentProject || !currentTestingType) {
      return null
    }

    // Ensure that we have loaded browsers to choose from
    if (this.ctx.appData.refreshingBrowsers) {
      await this.ctx.appData.refreshingBrowsers
    }

    const browser = this.ctx.wizardData.chosenBrowser ?? this.ctx.appData.browsers?.[0]

    if (!browser) {
      return null
    }

    const spec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: currentTestingType === 'e2e' ? 'integration' : 'component',
    }

    return this.api.launchProject(browser, spec, options)
  }

  async launchProjectWithoutElectron () {
    if (!this.ctx.currentProject) {
      throw Error('Cannot launch project without an active project')
    }

    const preferences = await this.api.getProjectPreferencesFromCache()
    const { browserPath, testingType } = preferences[this.ctx.currentProject.title] ?? {}

    if (!browserPath || !testingType) {
      throw Error('Cannot launch project without stored browserPath or testingType')
    }

    const spec = this.makeSpec(testingType)
    const browser = this.findBrowerByPath(browserPath)

    if (!browser) {
      throw Error(`Cannot find specified browser at given path: ${browserPath}.`)
    }

    this.ctx.actions.electron.hideBrowserWindow()
    await this.initializeActiveProject()

    return this.api.launchProject(browser, spec, {})
  }

  private makeSpec (testingType: TestingTypeEnum): Cypress.Spec {
    return {
      name: '',
      absolute: '',
      relative: '',
      specType: testingType === 'e2e' ? 'integration' : 'component',
    }
  }

  private findBrowerByPath (browserPath: string) {
    return this.ctx.coreData?.app?.browsers?.find((browser) => browser.path === browserPath)
  }

  removeProject (projectRoot: string) {
    const found = this.ctx.projectsList.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      throw new Error(`Cannot remove ${projectRoot}, it is not a known project`)
    }

    this.ctx.coreData.app.projects = this.ctx.coreData.app.projects.filter((project) => project !== projectRoot)
    this.api.removeProjectFromCache(projectRoot)
  }

  createConfigFile (args: { configFilename: string, code: string }) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create config file without currentProject.`)
    }

    this.ctx.fs.writeFileSync(path.resolve(project.projectRoot, args.configFilename), args.code)
  }

  async clearLatestProjectCache () {
    await this.api.clearLatestProjectsCache()
  }

  async clearProjectPreferencesCache (projectTitle: string) {
    await this.api.clearProjectPreferences(projectTitle)
  }

  async clearAllProjectPreferencesCache () {
    await this.api.clearAllProjectPreferences()
  }

  async createComponentIndexHtml (template: string) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create index.html without currentProject.`)
    }

    if (await this.ctx.project.isCTConfigured()) {
      const indexHtmlPath = path.resolve(project.projectRoot, 'cypress/component/support/index.html')

      await this.ctx.fs.outputFile(indexHtmlPath, template)
    }
  }

  async setProjectPreferences (args: MutationSetProjectPreferencesArgs) {
    if (!this.ctx.currentProject) {
      throw Error(`Cannot save preferences without currentProject.`)
    }

    this.api.insertProjectPreferencesToCache(this.ctx.currentProject.title, { ...args })
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create spec without currentProject.`)
    }

    const parsed = path.parse(codeGenCandidate)
    const config = project.config

    if (!config) {
      return null
    }

    const getFileExtension = () => {
      if (codeGenType === 'integration') {
        const possibleExtensions = ['.spec', '.test', '-spec', '-test']

        return (
          possibleExtensions.find((ext) => {
            return codeGenCandidate.endsWith(ext + parsed.ext)
          }) || parsed.ext
        )
      }

      return '.cy'
    }
    const getCodeGenPath = () => {
      return codeGenType === 'integration'
        ? this.ctx.path.join(
          config.integrationFolder || project.projectRoot,
          codeGenCandidate,
        )
        : codeGenCandidate
    }
    const getSearchFolder = () => {
      return (codeGenType === 'integration'
        ? config.integrationFolder
        : config.componentFolder) || project.projectRoot
    }

    const specFileExtension = getFileExtension()
    const codeGenPath = getCodeGenPath()
    const searchFolder = getSearchFolder()

    const newSpecCodeGenOptions = new SpecOptions(this.ctx, {
      codeGenPath,
      codeGenType,
      specFileExtension,
    })

    const codeGenOptions = await newSpecCodeGenOptions.getCodeGenOptions()
    const codeGenResults = await codeGenerator(
      { templateDir: templates[codeGenType], target: path.parse(codeGenPath).dir },
      codeGenOptions,
    )

    if (!codeGenResults.files[0] || codeGenResults.failed[0]) {
      throw (codeGenResults.failed[0] || 'Unable to generate spec')
    }

    const [newSpec] = codeGenResults.files

    const spec = this.ctx.file.normalizeFileToSpec({
      absolute: newSpec.file,
      searchFolder,
      specType: codeGenType === 'integration' ? 'integration' : 'component',
      projectRoot: project.projectRoot,
      specFileExtension,
    })

    return {
      spec,
      content: newSpec.content,
    }
  }

  loadConfigForProject (projectRoot: string): Promise<FullConfig | null> {
    const project = this.ctx.coreData.currentProject

    if (!project) {
      throw new Error(`Cannot access config without currentProject`)
    }

    if (!project.configPromise) {
      project.configPromise = Promise.resolve().then(async () => {
        const configFile = await this.ctx.config.getDefaultConfigBasename(projectRoot)

        return this.ctx._apis.projectApi.getConfig(projectRoot, { configFile })
      })
      .then((fullConfig) => {
        project.config = fullConfig

        return fullConfig
      })
      .catch((e) => {
        project.config = null
        project.errorLoadingConfig = e

        return null
      })
      .finally(() => {
        project.isLoadingConfig = false
        this.ctx.emitter.toLaunchpad()
      })
    }

    return project.configPromise
  }

  reconfigureProject () {
    this.ctx.actions.electron.refreshBrowserWindow()
    this.ctx.actions.electron.showBrowserWindow()
  }
}
