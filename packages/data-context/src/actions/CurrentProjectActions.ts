import type { CodeGenType, MutationSetProjectPreferencesArgs, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { CypressError, CypressErrorIdentifier, CypressErrorLike, FindSpecs, FoundBrowser, FoundSpec, FullConfig, LaunchArgs, LaunchOpts, OpenProjectLaunchOptions, Preferences, SettingsOptions } from '@packages/types'
import path from 'path'
import type { DataContext } from '..'
import { codeGenerator, SpecOptions } from '../codegen'
import templates from '../codegen/templates'
import type { CurrentProjectShape } from '../data/coreDataShape'

export interface ProjectApiShape {
  getConfig(projectRoot: string, options?: SettingsOptions): Promise<FullConfig>
  findSpecs(payload: FindSpecs): Promise<FoundSpec[]>
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  initializeProject(args: LaunchArgs, options: OpenProjectLaunchOptions<DataContext>, browsers: FoundBrowser[]): Promise<FoundBrowser[]>
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
  error(type: CypressErrorIdentifier, ...args: any[]): CypressError | CypressErrorLike
}

/**
 * All actions that can be taken given the assumption that there's a current
 * project specified. Also isolates the project
 */
export class CurrentProjectActions {
  constructor (private ctx: DataContext, private readonly currentProject: Readonly<CurrentProjectShape>) {}

  private get projectRoot () {
    return this.currentProject.projectRoot
  }

  /**
   * Update function, ensures that we keep the readonly currentProject while
   * being able to funnel all mutations through a single place. Will eventually
   * replace with immer
   */
  private update (updater: (proj: CurrentProjectShape) => void) {
    updater(this.currentProject)
  }

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearCurrentTestingType () {
    await this.api.closeActiveProject()
    this.update((p) => {
      p.currentTestingType = null
      p.browsers = null
    })
  }

  async clearCurrentProject () {
    await this.api.closeActiveProject()

    // TODO(tim): Improve general state management w/ immutability (immer) & updater fn
    this.ctx.coreData.currentProject = null
  }

  setCurrentTestingType (type: TestingTypeEnum) {
    this.update((p) => {
      p.currentTestingType = type
    })

    this.setupPluginEvents()
  }

  /**
   * Whether we have both the config & plugin events in a good state,
   * ready to start the application
   */
  private isReadyForLaunch () {
    return this.currentProject.currentBrowser && !(this.currentProject.errorLoadingConfig || this.currentProject.errorLoadingPlugins)
  }

  /**
   * Called when we choose the testing type, or at startup,
   * loads the config, and assuming no-error, loads the plugin events
   *
   * @param {boolean} true if we are just starting the application via the CLI
   */
  async loadConfigAndPlugins (launchOnReady = false) {
    await this.loadConfig()
    if (!this.currentProject.errorLoadingConfig) {
      await this.setupPluginEvents()
    }

    // If we're on initial load, we want to open the browser immediately after choosing
    if (launchOnReady && this.isReadyForLaunch()) {
      await this.launchAppInBrowser()
    }
  }

  /**
   * Starts the plugins for a given project, and launches
   * the development server if we are in component testing mode
   */
  async setupPluginEvents () {
    if (!this.currentProject.currentTestingType) {
      throw Error('Cannot initialize project without choosing testingType')
    }

    if (this.currentProject.isLoadingPlugins) {
      return
    }

    this.update((p) => {
      p.isLoadingPlugins = true
      p.errorLoadingPlugins = null
    })

    const machineBrowsers = await this.ctx.actions.app.loadMachineBrowsers()
    const browsers = [...(machineBrowsers ?? [])]
    const launchArgs: LaunchArgs = {
      ...this.ctx.launchArgs,
      projectRoot: this.projectRoot,
      testingType: this.currentProject.currentTestingType,
    }

    try {
      this.ctx.debug('setupPluginEvents')
      await this.api.closeActiveProject()
      const finalBrowsers = await this.api.initializeProject(launchArgs, {
        ...this.ctx.launchOptions,
        ctx: this.ctx,
      }, browsers)

      this.update((p) => {
        p.browsers = finalBrowsers
      })

      this.ctx.debug('setupPluginEvents finalBrowsers %o', finalBrowsers)
      await this.setActiveBrowserFromCLI(finalBrowsers)
    } catch (e) {
      this.ctx.debug('setupPluginEvents error %o', e)
      this.update((p) => {
        p.errorLoadingPlugins = this.ctx.prepError(e as Error, 'Cypress Configuration Error')
      })
    } finally {
      this.update((p) => {
        p.isLoadingPlugins = false
      })

      this.ctx.emitter.toLaunchpad()
    }
  }

  createProject () {
    //
  }

  // this.ctx.debug('Error getting browser by name or path (%s): %s', browserNameOrPath, err?.stack || err)
  // const message = err.details ? `${err.message}\n\n\`\`\`\n${err.details}\n\`\`\`` : err.message

  // this.ctx.coreData.warnings.push({
  //   title: 'Warning: Browser Not Found',
  //   message,
  //   setupStep: 'setupComplete',
  // })

  /**
   * Launches the project in the browser, based on the current testing type
   * @param options
   * @returns
   */
  async launchAppInBrowser () {
    const currentTestingType = this.currentProject.currentTestingType
    const browsers = this.currentProject.browsers

    if (!currentTestingType || !browsers?.length) {
      return null
    }

    const browser = this.currentProject.currentBrowser ?? browsers?.[0]

    if (!browser) {
      return null
    }

    const spec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: currentTestingType === 'e2e' ? 'integration' : 'component',
    }

    return this.api.launchProject(browser, spec, {
      onError: (err) => {

      },
      onBrowserClose: () => {

      },
      onBrowserOpen: () => {

      },
    })
  }

  async launchProjectWithoutElectron () {
    const preferences = await this.api.getProjectPreferencesFromCache()
    const { browserPath, testingType } = preferences[this.currentProject.title] ?? {}

    if (!browserPath || !testingType) {
      throw Error('Cannot launch project without stored browserPath or testingType')
    }

    const spec = this.makeSpec(testingType)
    const browser = this.findBrowerByPath(browserPath)

    if (!browser) {
      throw Error(`Cannot find specified browser at given path: ${browserPath}.`)
    }

    this.ctx.actions.electron.hideBrowserWindow()
    await this.loadConfigAndPlugins()

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
    return this.ctx.coreData?.app?.machineBrowsers?.find((browser) => browser.path === browserPath)
  }

  createConfigFile (args: { configFilename: string, code: string }) {
    const project = this.currentProject

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
    const project = this.currentProject

    if (!project) {
      throw Error(`Cannot create index.html without currentProject.`)
    }

    if (await this.ctx.project.isCTConfigured()) {
      const indexHtmlPath = path.resolve(project.projectRoot, 'cypress/component/support/index.html')

      await this.ctx.fs.outputFile(indexHtmlPath, template)
    }
  }

  async setProjectPreferences (args: MutationSetProjectPreferencesArgs) {
    this.api.insertProjectPreferencesToCache(this.currentProject.title, { ...args })
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType) {
    const parsed = path.parse(codeGenCandidate)
    const config = this.currentProject.config

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
          config.integrationFolder || this.projectRoot,
          codeGenCandidate,
        )
        : codeGenCandidate
    }
    const getSearchFolder = () => {
      return (codeGenType === 'integration'
        ? config.integrationFolder
        : config.componentFolder) || this.projectRoot
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
      projectRoot: this.projectRoot,
      specFileExtension,
    })

    return {
      spec,
      content: newSpec.content,
    }
  }

  /**
   * Loads the config for the project, signaling the state of loading via the
   * isLoadingConfig property on the project
   */
  loadConfig (): Promise<FullConfig> {
    let isLoadingConfigPromise = this.currentProject.isLoadingConfigPromise

    if (!isLoadingConfigPromise) {
      this.loadConfigExecution()
      this.update((proj) => {
        proj.isLoadingConfig = true
        proj.errorLoadingConfig = null
        proj.isLoadingConfigPromise = isLoadingConfigPromise
      })
    }

    return isLoadingConfigPromise as Promise<FullConfig>
  }

  private async loadConfigExecution (): Promise<FullConfig | null> {
    const { projectRoot } = this.currentProject

    try {
      const configFile = await this.ctx.config.getDefaultConfigBasename(projectRoot)
      const fullConfig = await this.ctx._apis.projectApi.getConfig(projectRoot, { configFile })

      this.ctx.debug('loadConfig %o', fullConfig)

      this.update((proj) => {
        proj.config = fullConfig
      })

      return fullConfig
    } catch (e) {
      this.ctx.debug('loadConfig error %o', e)
      this.update((proj) => {
        proj.errorLoadingConfig = this.ctx.prepError(e as Error, 'Cypress Configuration Error')
      })

      return null
    } finally {
      this.update((proj) => {
        proj.isLoadingConfig = false
        proj.isLoadingConfigPromise = null
      })

      this.ctx.emitter.toLaunchpad()
    }
  }

  setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')

    // Ensure that this is a valid ID to set
    const browser = this.ctx.appData.machineBrowsers?.find((b) => this.ctx.browser.idForBrowser(b) === browserId)

    if (browser) {
      this.update((p) => {
        p.currentBrowser = browser
      })
    }
  }

  reconfigureProject () {
    this.ctx.actions.electron.refreshBrowserWindow()
    this.ctx.actions.electron.showBrowserWindow()
  }

  async scaffoldIntegration () {
    const config = await this.loadConfig()
    const integrationFolder = config.integrationFolder || this.projectRoot

    const results = await codeGenerator(
      { templateDir: templates['scaffoldIntegration'], target: integrationFolder },
      {},
    )

    if (results.failed.length) {
      throw new Error(`Failed generating files: ${results.failed.map((e) => `${e}`)}`)
    }

    const withFileParts = results.files.map((res) => {
      return {
        fileParts: this.ctx.file.normalizeFileToFileParts({
          absolute: res.file,
          projectRoot: this.projectRoot,
          searchFolder: integrationFolder,
        }),
        codeGenResult: res,
      }
    })

    return withFileParts
  }

  async switchTestingType (testingType: TestingTypeEnum) {
    this.update((p) => {
      p.currentTestingType = testingType
    })

    await this.setupPluginEvents()
    await this.launchAppInBrowser()
  }

  async setActiveBrowserFromCLI (finalBrowsers: FoundBrowser[]) {
    const browserNameOrPath = this.currentProject.cliBrowser

    if (!browserNameOrPath) {
      return
    }

    this.update((p) => {
      p.cliBrowser = null
    })

    try {
      const browser = await this.ctx._apis.appApi.ensureAndGetByNameOrPath(browserNameOrPath, finalBrowsers)

      if (browser) {
        this.update((p) => {
          p.currentBrowser = browser
        })
      }
    } catch (err) {
      const e = err as Error

      this.ctx.debug('Error getting browser by name or path (%s): %s', browserNameOrPath, e?.stack || e)
      this.update((p) => {
        p.browserErrorMessage = `The browser '${browserNameOrPath}' was not found on your system or is not supported by Cypress. Choose a browser below.`
      })
    }
  }
}
