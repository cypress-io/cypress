import type { CodeGenType, MutationAddProjectArgs, MutationSetProjectPreferencesArgs, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { InitializeProjectOptions, FindSpecs, FoundBrowser, FoundSpec, FullConfig, LaunchOpts, OpenProjectLaunchOptions, Preferences, SettingsOptions } from '@packages/types'
import execa from 'execa'
import path from 'path'
import type { ActiveProjectShape, ProjectShape } from '../data/coreDataShape'

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
  initializeProject(args: InitializeProjectOptions, options: OpenProjectLaunchOptions, browsers: FoundBrowser[]): Promise<unknown>
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
  error: {
    throw: (type: string, ...args: any) => Error
    get(type: string, ...args: any): Error & { code: string, isCypressErr: boolean}
  }
}

export class ProjectActions {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearActiveProject () {
    this.ctx.actions.projectConfig.killConfigProcess()
    await this.api.closeActiveProject()

    // TODO(tim): Improve general state management w/ immutability (immer) & updater fn
    this.ctx.coreData.currentProject = null
    this.ctx.coreData.app.currentTestingType = null
  }

  private get projects () {
    return this.ctx.coreData.app.projects
  }

  private set projects (projects: ProjectShape[]) {
    this.ctx.coreData.app.projects = projects
  }

  openDirectoryInIDE (projectPath: string) {
    this.ctx.debug(`opening ${projectPath} in ${this.ctx.coreData.localSettings.preferences.preferredEditorBinary}`)

    if (!this.ctx.coreData.localSettings.preferences.preferredEditorBinary) {
      return
    }

    if (this.ctx.coreData.localSettings.preferences.preferredEditorBinary === 'computer') {
      this.ctx.actions.electron.showItemInFolder(projectPath)
    }

    execa(this.ctx.coreData.localSettings.preferences.preferredEditorBinary, [projectPath])
  }

  async setActiveProject (projectRoot: string) {
    const title = this.ctx.project.projectTitle(projectRoot)

    await this.clearActiveProject()

    // Set initial properties, so we can set the config object on the active project
    this.setCurrentProjectProperties({
      projectRoot,
      title,
      ctPluginsInitialized: false,
      e2ePluginsInitialized: false,
      config: null,
      configChildProcess: null,
      isMissingConfigFile: false,
      preferences: await this.ctx.project.getProjectPreferences(title),
    })

    try {
      // read the config and cache it
      await this.ctx.project.getConfig(projectRoot)

      this.setCurrentProjectProperties({
        isCTConfigured: await this.ctx.project.isTestingTypeConfigured(projectRoot, 'component'),
        isE2EConfigured: await this.ctx.project.isTestingTypeConfigured(projectRoot, 'e2e'),
      })

      return this
    } catch (error: any) {
      if (error.type === 'NO_DEFAULT_CONFIG_FILE_FOUND') {
        this.setCurrentProjectProperties({
          isMissingConfigFile: true,
        })

        return this
      }

      if (this.ctx.isRunMode) {
        throw error
      }

      this.ctx.update((d) => {
        d.baseError = {
          title: 'Error',
          message: error.message,
          stack: error.stack,
        }
      })

      return this
    }
  }

  // Temporary: remove after other refactor lands
  setActiveProjectForTestSetup (projectRoot: string) {
    this.ctx.actions.projectConfig.killConfigProcess()

    const title = this.ctx.project.projectTitle(projectRoot)

    // Set initial properties, so we can set the config object on the active project
    this.setCurrentProjectProperties({
      projectRoot,
      title,
      ctPluginsInitialized: false,
      e2ePluginsInitialized: false,
      config: null,
      configChildProcess: null,
    })
  }

  setCurrentProjectProperties (currentProjectProperties: Partial<ActiveProjectShape>) {
    this.ctx.coreData.currentProject = {
      browsers: this.ctx.coreData.app.browsers,
      ...this.ctx.coreData.currentProject,
      ...currentProjectProperties,
    } as ActiveProjectShape
  }

  async loadProjects () {
    const projectRoots = await this.api.getProjectRootsFromCache()

    this.projects = [
      ...this.projects,
      ...projectRoots.map((projectRoot) => ({ projectRoot })),
    ]

    return this.projects
  }

  async initializeActiveProject (options: OpenProjectLaunchOptions = {}) {
    if (!this.ctx.currentProject?.projectRoot) {
      throw Error('Cannot initialize project without an active project')
    }

    if (!this.ctx.wizardData.chosenTestingType) {
      throw Error('Cannot initialize project without choosing testingType')
    }

    // Ensure that we have loaded browsers to choose from
    if (this.ctx.appData.refreshingBrowsers) {
      await this.ctx.appData.refreshingBrowsers
    }

    const browsers = [...(this.ctx.browserList ?? [])]

    const allModeOptionsWithLatest: InitializeProjectOptions = {
      ...this.ctx.modeOptions,
      projectRoot: this.ctx.currentProject.projectRoot,
      testingType: this.ctx.wizardData.chosenTestingType,
    }

    try {
      await this.api.closeActiveProject()
      await this.api.initializeProject(allModeOptionsWithLatest, {
        ...options,
        ctx: this.ctx,
      }, browsers)
    } catch (e) {
      // TODO(tim): remove / replace with ctx.log.error
      // eslint-disable-next-line
      console.error(e)
      throw e
    }
  }

  createProject () {
    //
  }

  async addProject (args: MutationAddProjectArgs) {
    const projectRoot = await this.getDirectoryPath(args.path)

    const found = this.projects.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      this.projects.push({ projectRoot })
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

  async launchProject (testingType: TestingTypeEnum | null, options: LaunchOpts, specPath?: string | null) {
    if (!this.ctx.currentProject) {
      return null
    }

    testingType = testingType || this.ctx.wizardData.chosenTestingType

    if (!testingType) {
      return null
    }

    let activeSpec: FoundSpec | undefined

    if (specPath) {
      activeSpec = await this.ctx.project.getCurrentSpecByAbsolute(this.ctx.currentProject.projectRoot, specPath)
    }

    // Ensure that we have loaded browsers to choose from
    if (this.ctx.appData.refreshingBrowsers) {
      await this.ctx.appData.refreshingBrowsers
    }

    const browser = this.ctx.wizardData.chosenBrowser ?? this.ctx.appData.browsers?.[0]

    if (!browser) {
      return null
    }

    // launchProject expects a spec when opening browser for url navigation.
    // We give it an empty spec if none is passed so as to land on home page
    const emptySpec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: testingType === 'e2e' ? 'integration' : 'component',
    }

    this.ctx.appData.currentTestingType = testingType

    return this.api.launchProject(browser, activeSpec ?? emptySpec, options)
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
    this.ctx.coreData.wizard.chosenTestingType = testingType
    await this.initializeActiveProject()
    this.ctx.appData.currentTestingType = testingType

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

    this.projects = this.projects.filter((project) => project.projectRoot !== projectRoot)
    this.api.removeProjectFromCache(projectRoot)
  }

  syncProjects () {
    //
  }

  async createConfigFile (type?: 'component' | 'e2e' | null) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create config file without currentProject.`)
    }

    let obj: { [k: string]: object } = {
      e2e: {},
      component: {},
    }

    if (type) {
      obj = {
        [type]: {},
      }
    }

    await this.ctx.fs.writeFile(path.resolve(project.projectRoot, 'cypress.config.js'), `module.exports = ${JSON.stringify(obj, null, 2)}`)

    this.setCurrentProjectProperties({
      isMissingConfigFile: false,
    })
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

    if (this.ctx.currentProject?.isCTConfigured) {
      const indexHtmlPath = path.resolve(this.ctx.currentProject.projectRoot, 'cypress/component/support/index.html')

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
    const config = await this.ctx.config.getConfigForProject(project.projectRoot)

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

  reconfigureProject () {
    this.ctx.actions.wizard.resetWizard()
    this.ctx.actions.electron.refreshBrowserWindow()
    this.ctx.actions.electron.showBrowserWindow()
  }

  async scaffoldIntegration () {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create spec without activeProject.`)
    }

    const config = await this.ctx.project.getConfig(project.projectRoot)
    const integrationFolder = config.integrationFolder || project.projectRoot

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
          projectRoot: project.projectRoot,
          searchFolder: integrationFolder,
        }),
        codeGenResult: res,
      }
    })

    return withFileParts
  }
}
