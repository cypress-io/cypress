import type { CodeGenType, MutationSetProjectPreferencesArgs, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { FindSpecs, FoundBrowser, FoundSpec, FullConfig, LaunchOpts, Preferences, SettingsOptions } from '@packages/types'
import path from 'path'
import type { Draft } from 'immer'

import type { DataContext } from '..'
import { codeGenerator, SpecOptions } from '../codegen'
import templates from '../codegen/templates'
import type { CurrentProjectDataShape, PluginIpcHandler } from '../data/coreDataShape'
import type { CurrentProjectDataSource } from '../sources'
import execa from 'execa'

export interface LegacyOpenProjectShape {
  close(): Promise<null>
  create(...args: any[]): Promise<unknown>
  launch(...args: any[]): Promise<unknown>
}

export interface ProjectApiShape {
  // TODO: type this
  saveState(state: object): Promise<unknown>
  getPluginIpcHandlers(): PluginIpcHandler[]
  makeLegacyOpenProject(): LegacyOpenProjectShape
  getConfig(options?: SettingsOptions): Promise<FullConfig>
  findSpecs(payload: FindSpecs): Promise<FoundSpec[]>
  launchProject(browser: FoundBrowser, spec: Cypress.Spec, options: LaunchOpts): void
  insertProjectToCache(projectRoot: string): void
  removeProjectFromCache(projectRoot: string): void
  getProjectRootsFromCache(): Promise<string[]>
  insertProjectPreferencesToCache(projectTitle: string, preferences: Preferences): void
  getProjectPreferencesFromCache(): Promise<Record<string, Preferences>>
  clearLatestProjectsCache(): Promise<unknown>
  clearProjectPreferences(projectTitle: string): Promise<unknown>
  clearAllProjectPreferences(): Promise<unknown>
}

/**
 * All actions that can be taken given the assumption that there's a current
 * project specified. Also isolates the project
 */
export class CurrentProjectActions {
  constructor (private ctx: DataContext, private currentProject: CurrentProjectDataSource) {}

  async initializePlugins () {
    // // only init plugins with the
    // // allowed config values to
    // // prevent tampering with the
    // // internals and breaking cypress
    // const allowedCfg = allowed(cfg)

    // const modifiedCfg = await plugins.init(allowedCfg, {
    //   projectRoot: this.projectRoot,
    //   configFile: settings.pathToConfigFile(this.projectRoot, options),
    //   testingType: options.testingType,
    //   onError: (err: Error) => this._onError(err, options),
    //   onWarning: options.onWarning,
    // }, this.ctx)

    // debug('plugin config yielded: %o', modifiedCfg)

    // return config.updateWithPluginValues(cfg, modifiedCfg)
  }

  // TODO: get proper typings for this?
  saveState (state: object) {
    return this.ctx._apis.projectApi.saveState(state)
  }

  async clearCurrentTestingType () {
    this.update((p) => {
      p.currentTestingType = null
    })
  }

  async clearCurrentProject () {
    this.ctx.update((s) => {
      s.currentProject = null
    })
  }

  /**
   * When we set the current testing type, which happens as a mutation from the frontend,
   * we want to kickoff the "loading" of any plugin events for the given testing type
   */
  setCurrentTestingType (type: TestingTypeEnum) {
    this.update((p) => {
      p.currentTestingType = type
    })
  }

  /**
   * Whether we have both the config & plugin events in a good state,
   * ready to start the application
   */
  private isReadyForLaunch () {
    return this.currentProject.currentBrowser && this.ctx.loadedVal(this.currentProject.data.configFileContents)
  }

  // /**
  //  * Called when we choose the testing type, or at startup,
  //  * loads the config, and assuming no-error, loads the plugin events
  //  *
  //  * @param {boolean} true if we are just starting the application via the CLI
  //  */
  // async loadConfigAndPlugins (launchOnReady = false) {
  //   await this.loadConfig()
  //   if (!this.currentProject.errorLoadingConfig) {
  //     await this.setupNodeEvents()
  //   }

  //   // If we're on initial load, we want to open the browser immediately after choosing
  //   if (launchOnReady && this.isReadyForLaunch()) {
  //     await this.launchAppInBrowser()
  //   }
  // }

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
  async launchAppInBrowser (specPath?: string | null) {
    const currentTestingType = this.currentProject.currentTestingType
    const browsers = this.currentProject.browsers

    if (!currentTestingType || !browsers?.length || !this.ctx.project) {
      return null
    }

    const browser = this.currentProject.currentBrowser ?? browsers?.[0]

    if (!browser) {
      return null
    }

    // launchProject expects a spec when opening browser for url navigation.
    // We give it an empty spec if none is passed so as to land on home page
    const emptySpec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: currentTestingType === 'e2e' ? 'integration' : 'component',
    }

    let activeSpec: FoundSpec | undefined

    if (specPath) {
      activeSpec = await this.ctx.project.getCurrentSpecByAbsolute(specPath)
    }

    this.ctx.currentProject?.legacyOpenProject?.launch(browser, activeSpec ?? emptySpec, {
      onError: (err) => {

      },
      onBrowserClose: () => {

      },
      onBrowserOpen: () => {

      },
    })
  }

  // async launchProjectWithoutElectron () {
  //   const preferences = await this.api.getProjectPreferencesFromCache()
  //   const { browserPath, testingType } = preferences[this.currentProject.title] ?? {}

  //   if (!browserPath || !testingType) {
  //     throw Error('Cannot launch project without stored browserPath or testingType')
  //   }

  //   const spec = this.makeSpec(testingType)
  //   const browser = this.findBrowerByPath(browserPath)

  //   if (!browser) {
  //     throw Error(`Cannot find specified browser at given path: ${browserPath}.`)
  //   }

  //   this.ctx.actions.electron.hideBrowserWindow()
  //   await this.loadConfigAndPlugins()

  //   return this.api.launchProject(browser, spec, {})
  // }

  private makeSpec (testingType: TestingTypeEnum): Cypress.Spec {
    return {
      name: '',
      absolute: '',
      relative: '',
      specType: testingType === 'e2e' ? 'integration' : 'component',
    }
  }

  private findBrowerByPath (browserPath: string) {
    return this.ctx.loadedVal(this.ctx.coreData?.machineBrowsers)?.find((browser) => browser.path === browserPath)
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
    const indexHtmlPath = path.resolve(this.currentProject.projectRoot, 'cypress/component/support/index.html')

    await this.ctx.fs.outputFile(indexHtmlPath, template)
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
          config.integrationFolder || this.currentProject.projectRoot,
          codeGenCandidate,
        )
        : codeGenCandidate
    }
    const getSearchFolder = () => {
      return (codeGenType === 'integration'
        ? config.integrationFolder
        : config.componentFolder) || this.currentProject.projectRoot
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
      projectRoot: this.currentProject.projectRoot,
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
  reloadConfig () {
    this.ctx.loadingManager.projectConfig.reload()
  }

  setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')

    // Ensure that this is a valid ID to set
    const browser = this.ctx.loadedVal(this.ctx.coreData.machineBrowsers)?.find((b) => this.ctx.browser.idForBrowser(b) === browserId)

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

  async openDirectoryInIDE (projectPath: string) {
    const result = await this.ctx.loadingManager.localSettings.load()

    if (!result) {
      return
    }

    const { preferences } = result

    this.ctx.debug(`opening ${projectPath} in ${preferences.preferredEditorBinary}`)

    if (!preferences.preferredEditorBinary) {
      return
    }

    if (preferences.preferredEditorBinary === 'computer') {
      this.ctx.actions.electron.showItemInFolder(projectPath)
    }

    return execa(preferences.preferredEditorBinary, [projectPath])
  }

  async scaffoldIntegration () {
    const config = this.currentProject.loadedConfig()
    const integrationFolder = config?.integrationFolder || this.currentProject.projectRoot

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
          projectRoot: this.currentProject.projectRoot,
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

    await this.launchAppInBrowser()
  }

  /**
   * Update function, ensures that we are only updating the current project if
   * it hasn't been swapped out (we can remove this guard when we refactor closeActiveProject)
   */
  private update (updater: (proj: Draft<CurrentProjectDataShape>) => void) {
    this.ctx.update((s) => {
      if (s.currentProject?.projectRoot === this.currentProject.projectRoot) {
        updater(s.currentProject)
      }
    })
  }

  private get api () {
    return this.ctx._apis.projectApi
  }
}
