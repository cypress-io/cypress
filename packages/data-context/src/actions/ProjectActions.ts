import type { CodeGenType, MutationSetProjectPreferencesArgs, NexusGenObjects, NexusGenUnions } from '@packages/graphql/src/gen/nxs.gen'
import type { InitializeProjectOptions, FoundBrowser, FoundSpec, LaunchOpts, OpenProjectLaunchOptions, Preferences, TestingType, ReceivedCypressOptions, AddProject, FullConfig } from '@packages/types'
import type { EventEmitter } from 'events'
import execa from 'execa'
import path from 'path'
import assert from 'assert'

import type { Maybe, ProjectShape, SavedStateShape } from '../data/coreDataShape'

import type { DataContext } from '..'
import { codeGenerator, SpecOptions } from '../codegen'
import templates from '../codegen/templates'
import { insertValuesInConfigFile } from '../util'
import { getError } from '@packages/errors'
import { resetIssuedWarnings } from '@packages/config'

export interface ProjectApiShape {
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  openProjectCreate(args: InitializeProjectOptions, options: OpenProjectLaunchOptions): Promise<unknown>
  launchProject(browser: FoundBrowser, spec: Cypress.Spec, options: LaunchOpts): Promise<void>
  insertProjectToCache(projectRoot: string): Promise<void>
  removeProjectFromCache(projectRoot: string): Promise<void>
  getProjectRootsFromCache(): Promise<ProjectShape[]>
  insertProjectPreferencesToCache(projectTitle: string, preferences: Preferences): void
  getProjectPreferencesFromCache(): Promise<Record<string, Preferences>>
  clearLatestProjectsCache(): Promise<unknown>
  clearProjectPreferences(projectTitle: string): Promise<unknown>
  clearAllProjectPreferences(): Promise<unknown>
  closeActiveProject(shouldCloseBrowser?: boolean): Promise<unknown>
  getConfig(): ReceivedCypressOptions | undefined
  getRemoteStates(): { reset(): void, getPrimary(): Cypress.RemoteState } | undefined
  getCurrentBrowser: () => Cypress.Browser | undefined
  getCurrentProjectSavedState(): {} | undefined
  setPromptShown(slug: string): void
  makeProjectSavedState(projectRoot: string): () => Promise<Maybe<SavedStateShape>>
  getDevServer (): {
    updateSpecs(specs: FoundSpec[]): void
    start(options: {specs: Cypress.Spec[], config: FullConfig}): Promise<{port: number}>
    close(): void
    emitter: EventEmitter
  }
  isListening: (url: string) => Promise<void>
}

export interface FindSpecs<T> {
  projectRoot: string
  testingType: Cypress.TestingType
  /**
   * This can be over-ridden by the --spec argument (run mode only)
   * Otherwise it will be the same as `configSpecPattern`
   */
  specPattern: T
  /**
   * The specPattern resolved from e2e.specPattern or component.specPattern
   * inside of `cypress.config`.
   */
  configSpecPattern: T
  /**
   * User can opt to exclude certain patterns in cypress.config.
   */
  excludeSpecPattern: T
  /**
   * If in component testing mode, we exclude all specs matching the e2e.specPattern.
   */
  additionalIgnorePattern: T
}

type SetForceReconfigureProjectByTestingType = {
  forceReconfigureProject: boolean
  testingType?: TestingType
}

export class ProjectActions {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearCurrentProject () {
    this.ctx.update((d) => {
      d.baseError = null
      d.activeBrowser = null
      d.currentProject = null
      d.currentProjectData = null
      d.currentTestingType = null
      d.forceReconfigureProject = null
      d.scaffoldedFiles = null
      d.app.browserStatus = 'closed'
    })

    await this.ctx.lifecycleManager.clearCurrentProject()
    resetIssuedWarnings()
    await this.api.closeActiveProject()
  }

  private get projects () {
    return this.ctx.projectsList
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

  setAndLoadCurrentTestingType (type: TestingType) {
    this.ctx.lifecycleManager.setAndLoadCurrentTestingType(type)
  }

  async setCurrentProject (projectRoot: string) {
    await this.updateProjectList(() => this.api.insertProjectToCache(projectRoot))

    await this.clearCurrentProject()
    await this.ctx.lifecycleManager.setCurrentProject(projectRoot)
  }

  // Temporary: remove after other refactor lands
  async setCurrentProjectAndTestingTypeForTestSetup (projectRoot: string) {
    await this.ctx.lifecycleManager.clearCurrentProject()
    await this.ctx.lifecycleManager.setCurrentProject(projectRoot)
    this.ctx.lifecycleManager.setCurrentTestingType('e2e')
    // @ts-expect-error - we are setting this as a convenience for our integration tests
    this.ctx._modeOptions = {}
  }

  async loadProjects () {
    const projectRoots = await this.api.getProjectRootsFromCache()

    this.ctx.update((d) => {
      d.app.projects = [...projectRoots]
    })

    return this.projects
  }

  async initializeActiveProject (options: OpenProjectLaunchOptions = {}) {
    assert(this.ctx.currentProject, 'Cannot initialize project without an active project')
    assert(this.ctx.coreData.currentTestingType, 'Cannot initialize project without choosing testingType')

    const allModeOptionsWithLatest: InitializeProjectOptions = {
      ...this.ctx.modeOptions,
      projectRoot: this.ctx.currentProject,
      testingType: this.ctx.coreData.currentTestingType,
    }

    try {
      await this.api.closeActiveProject()

      return await this.api.openProjectCreate(allModeOptionsWithLatest, {
        ...options,
        ctx: this.ctx,
      }).finally(async () => {
        // When switching testing type, the project should be relaunched in the previously selected browser
        if (this.ctx.coreData.app.relaunchBrowser) {
          this.ctx.project.setRelaunchBrowser(false)
          await this.ctx.actions.project.launchProject(this.ctx.coreData.currentTestingType, {})
        }
      })
    } catch (e) {
      // TODO(tim): remove / replace with ctx.log.error
      // eslint-disable-next-line
      console.error(e)
      throw e
    }
  }

  private async updateProjectList (updater: () => Promise<void>) {
    return updater().then(() => this.loadProjects())
  }

  async addProjectFromElectronNativeFolderSelect () {
    const path = await this.ctx.actions.electron.showOpenDialog()

    if (!path) {
      return
    }

    await this.addProject({ path, open: true })

    this.ctx.emitter.toLaunchpad()
  }

  async addProject (args: AddProject) {
    const projectRoot = await this.getDirectoryPath(args.path)

    if (args.open) {
      this.setCurrentProject(projectRoot).catch(this.ctx.onError)
    } else {
      await this.updateProjectList(() => this.api.insertProjectToCache(projectRoot))
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

  async launchProject (testingType: Cypress.TestingType | null, options: LaunchOpts, specPath?: string | null) {
    if (!this.ctx.currentProject) {
      return null
    }

    testingType = testingType || this.ctx.coreData.currentTestingType

    // It's strange to have no testingType here, but `launchProject` is called when switching testing types,
    // so it needs to short-circuit and return here.
    // TODO: Untangle this. https://cypress-io.atlassian.net/browse/UNIFY-1528
    if (!testingType) return

    this.ctx.coreData.currentTestingType = testingType

    const browser = this.ctx.coreData.activeBrowser

    if (!browser) throw new Error('Missing browser in launchProject')

    let activeSpec: FoundSpec | undefined

    if (specPath) {
      activeSpec = this.ctx.project.getCurrentSpecByAbsolute(specPath)
    }

    // launchProject expects a spec when opening browser for url navigation.
    // We give it an empty spec if none is passed so as to land on home page
    const emptySpec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: testingType === 'e2e' ? 'integration' : 'component',
    }

    await this.api.launchProject(browser, activeSpec ?? emptySpec, options)

    return
  }

  removeProject (projectRoot: string) {
    return this.updateProjectList(() => this.api.removeProjectFromCache(projectRoot))
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

  async setProjectIdInConfigFile (projectId: string) {
    return insertValuesInConfigFile(this.ctx.lifecycleManager.configFilePath, { projectId }, { get (id: string) {
      return Error(id)
    } })
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

  setPromptShown (slug: string) {
    this.api.setPromptShown(slug)
  }

  setSpecs (specs: FoundSpec[]) {
    this.ctx.project.setSpecs(specs)
    this.refreshSpecs(specs)

    if (this.ctx.coreData.currentTestingType === 'component') {
      this.api.getDevServer().updateSpecs(specs)
    }

    this.ctx.emitter.specsChange()
  }

  refreshSpecs (specs: FoundSpec[]) {
    this.ctx.lifecycleManager.git?.setSpecs(specs.map((s) => s.absolute))
  }

  setProjectPreferences (args: MutationSetProjectPreferencesArgs) {
    if (!this.ctx.currentProject) {
      throw Error(`Cannot save preferences without currentProject.`)
    }

    this.api.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, args)
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType, erroredCodegenCandidate?: string | null): Promise<NexusGenUnions['GeneratedSpecResult']> {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create spec without currentProject.`)
    }

    const getCodeGenPath = () => {
      return codeGenType === 'e2e' || erroredCodegenCandidate
        ? this.ctx.path.join(
          project,
          codeGenCandidate,
        )
        : codeGenCandidate
    }

    const codeGenPath = getCodeGenPath()

    const newSpecCodeGenOptions = new SpecOptions(this.ctx, {
      codeGenPath,
      codeGenType,
      erroredCodegenCandidate,
    })

    let codeGenOptions = await newSpecCodeGenOptions.getCodeGenOptions()

    const codeGenResults = await codeGenerator(
      { templateDir: templates[codeGenType], target: path.parse(codeGenPath).dir },
      codeGenOptions,
    )

    if (!codeGenResults.files[0] || codeGenResults.failed[0]) {
      throw (codeGenResults.failed[0] || 'Unable to generate spec')
    }

    const [newSpec] = codeGenResults.files

    const cfg = await this.ctx.project.getConfig()

    if (cfg && this.ctx.currentProject) {
      const testingType = (codeGenType === 'component') ? 'component' : 'e2e'

      await this.setSpecsFoundBySpecPattern({
        projectRoot: this.ctx.currentProject,
        testingType,
        specPattern: cfg.specPattern ?? [],
        configSpecPattern: cfg.specPattern ?? [],
        excludeSpecPattern: cfg.excludeSpecPattern,
        additionalIgnorePattern: cfg.additionalIgnorePattern,
      })
    }

    return {
      status: 'valid',
      file: { absolute: newSpec.file, contents: newSpec.content },
      description: 'Generated spec',
    }
  }

  async setSpecsFoundBySpecPattern ({ projectRoot, testingType, specPattern, configSpecPattern, excludeSpecPattern, additionalIgnorePattern }: FindSpecs<string | string[] | undefined>) {
    const toArray = (val?: string | string[]) => val ? typeof val === 'string' ? [val] : val : []

    configSpecPattern = toArray(configSpecPattern)
    specPattern = toArray(specPattern)

    excludeSpecPattern = toArray(excludeSpecPattern) || []

    // exclude all specs matching e2e if in component testing
    additionalIgnorePattern = toArray(additionalIgnorePattern) || []

    if (!specPattern || !configSpecPattern) {
      throw Error('could not find pattern to load specs')
    }

    const specs = await this.ctx.project.findSpecs({
      projectRoot,
      testingType,
      specPattern,
      configSpecPattern,
      excludeSpecPattern,
      additionalIgnorePattern,
    })

    this.ctx.actions.project.setSpecs(specs)

    await this.ctx.project.startSpecWatcher({
      projectRoot,
      testingType,
      specPattern,
      configSpecPattern,
      excludeSpecPattern,
      additionalIgnorePattern,
    })
  }

  setForceReconfigureProjectByTestingType ({ forceReconfigureProject, testingType }: SetForceReconfigureProjectByTestingType) {
    const testingTypeToReconfigure = testingType ?? this.ctx.coreData.currentTestingType

    if (!testingTypeToReconfigure) {
      return
    }

    this.ctx.update((coreData) => {
      coreData.forceReconfigureProject = {
        ...coreData.forceReconfigureProject,
        [testingTypeToReconfigure]: forceReconfigureProject,
      }
    })
  }

  async reconfigureProject () {
    await this.ctx.actions.browser.closeBrowser()
    this.ctx.actions.wizard.resetWizard()
    this.ctx.actions.wizard.initialize()
    this.ctx.actions.electron.refreshBrowserWindow()
    this.ctx.actions.electron.showBrowserWindow()
  }

  get defaultE2EPath () {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create e2e directory without currentProject.`)

    return path.join(projectRoot, 'cypress', 'e2e')
  }

  async scaffoldIntegration (): Promise<NexusGenObjects['ScaffoldedFile'][]> {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create spec without currentProject.`)

    const results = await codeGenerator(
      { templateDir: templates['scaffoldIntegration'], target: this.defaultE2EPath },
      {},
    )

    if (results.failed.length) {
      throw new Error(`Failed generating files: ${results.failed.map((e) => `${e}`)}`)
    }

    return results.files.map(({ status, file, content }) => {
      return {
        status: (status === 'add' || status === 'overwrite') ? 'valid' : 'skipped',
        file: { absolute: file, contents: content },
        description: 'Generated spec',
      }
    })
  }

  async pingBaseUrl () {
    const baseUrl = (await this.ctx.project.getConfig())?.baseUrl

    // Should never happen
    if (!baseUrl) {
      return
    }

    const baseUrlWarning = this.ctx.warnings.find((e) => e.cypressError.type === 'CANNOT_CONNECT_BASE_URL_WARNING')

    if (baseUrlWarning) {
      this.ctx.actions.error.clearWarning(baseUrlWarning.id)
      this.ctx.emitter.errorWarningChange()
    }

    return this.api.isListening(baseUrl)
    .catch(() => this.ctx.onWarning(getError('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl)))
  }

  async switchTestingTypesAndRelaunch (testingType: Cypress.TestingType): Promise<void> {
    const isTestingTypeConfigured = this.ctx.lifecycleManager.isTestingTypeConfigured(testingType)

    this.ctx.project.setRelaunchBrowser(isTestingTypeConfigured)
    this.setAndLoadCurrentTestingType(testingType)

    await this.reconfigureProject()

    if (testingType === 'e2e' && !isTestingTypeConfigured) {
      // E2E doesn't have a wizard, so if we have a testing type on load we just create/update their cypress.config.js.
      await this.ctx.actions.wizard.scaffoldTestingType()
    }
  }
}
