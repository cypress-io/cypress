import type { CodeGenType, MutationAddProjectArgs, MutationSetProjectPreferencesArgs, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { InitializeProjectOptions, FindSpecs, FoundBrowser, FoundSpec, LaunchOpts, OpenProjectLaunchOptions, Preferences, SettingsOptions, TestingType } from '@packages/types'
import execa from 'execa'
import path from 'path'
import type { ProjectShape } from '../data/coreDataShape'

import type { DataContext } from '..'
import { codeGenerator, SpecOptions } from '../codegen'
import templates from '../codegen/templates'

export interface ProjectApiShape {
  findSpecs(payload: FindSpecs): Promise<FoundSpec[]>
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  initializeProject(args: InitializeProjectOptions, options: OpenProjectLaunchOptions): Promise<unknown>
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
}

export class ProjectActions {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearCurrentProject () {
    // this.ctx.actions.projectConfig.killConfigProcess()
    this.ctx.lifecycleManager.clearCurrentProject()
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

  setCurrentTestingType (type: TestingType) {
    this.ctx.lifecycleManager.setCurrentTestingType(type)
    // TODO: Remove from wizard
    this.ctx.coreData.wizard.currentTestingType = type
  }

  async setCurrentProject (projectRoot: string) {
    await this.clearCurrentProject()
    this.ctx.lifecycleManager.clearCurrentProject()
    this.ctx.lifecycleManager.setCurrentProject(projectRoot)
  }

  // Temporary: remove after other refactor lands
  setCurrentProjectForTestSetup (projectRoot: string) {
    this.ctx.lifecycleManager.clearCurrentProject()
    this.ctx.lifecycleManager.setCurrentProject(projectRoot)
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
    if (!this.ctx.currentProject) {
      throw Error('Cannot initialize project without an active project')
    }

    if (!this.ctx.wizardData.currentTestingType) {
      throw Error('Cannot initialize project without choosing testingType')
    }

    const allModeOptionsWithLatest: InitializeProjectOptions = {
      ...this.ctx.modeOptions,
      projectRoot: this.ctx.currentProject,
      testingType: this.ctx.wizardData.currentTestingType,
    }

    try {
      await this.api.closeActiveProject()
      await this.api.initializeProject(allModeOptionsWithLatest, {
        ...options,
        ctx: this.ctx,
      })
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
      await this.setCurrentProject(projectRoot)
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

    testingType = testingType || this.ctx.wizardData.currentTestingType

    if (!testingType) {
      return null
    }

    let activeSpec: FoundSpec | undefined

    if (specPath) {
      activeSpec = await this.ctx.project.getCurrentSpecByAbsolute(this.ctx.currentProject, specPath)
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
    const { browserPath, testingType } = preferences[this.ctx.lifecycleManager.projectTitle] ?? {}

    if (!browserPath || !testingType) {
      throw Error('Cannot launch project without stored browserPath or testingType')
    }

    const spec = this.makeSpec(testingType)
    const browser = this.findBrowerByPath(browserPath)

    if (!browser) {
      throw Error(`Cannot find specified browser at given path: ${browserPath}.`)
    }

    this.ctx.actions.electron.hideBrowserWindow()
    this.ctx.coreData.wizard.currentTestingType = testingType
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

    await this.ctx.fs.writeFile(this.ctx.lifecycleManager.configFilePath, `module.exports = ${JSON.stringify(obj, null, 2)}`)
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

    if (this.ctx.lifecycleManager.isTestingTypeConfigured('component')) {
      const indexHtmlPath = path.resolve(project, 'cypress/component/support/index.html')

      await this.ctx.fs.outputFile(indexHtmlPath, template)
    }
  }

  async setProjectPreferences (args: MutationSetProjectPreferencesArgs) {
    if (!this.ctx.currentProject) {
      throw Error(`Cannot save preferences without currentProject.`)
    }

    this.api.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, { ...args })
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create spec without currentProject.`)
    }

    const parsed = path.parse(codeGenCandidate)
    const config = await this.ctx.lifecycleManager.getFullInitialConfig()

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
          config.integrationFolder || project,
          codeGenCandidate,
        )
        : codeGenCandidate
    }
    const getSearchFolder = () => {
      return (codeGenType === 'integration'
        ? config.integrationFolder
        : config.componentFolder) || project
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
      projectRoot: project,
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

    const config = await this.ctx.project.getConfig(project)
    const integrationFolder = config.integrationFolder || project

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
          projectRoot: project,
          searchFolder: integrationFolder,
        }),
        codeGenResult: res,
      }
    })

    return withFileParts
  }
}
