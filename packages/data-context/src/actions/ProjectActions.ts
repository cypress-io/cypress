import type { MutationSetProjectPreferencesInGlobalCacheArgs } from '@packages/graphql/src/gen/nxs.gen'
import { InitializeProjectOptions, FoundBrowser, OpenProjectLaunchOptions, Preferences, TestingType, ReceivedCypressOptions, AddProject, FullConfig, AllowedState, SpecWithRelativeRoot, OpenProjectLaunchOpts, RUN_ALL_SPECS, RUN_ALL_SPECS_KEY } from '@packages/types'
import type { EventEmitter } from 'events'
import execa from 'execa'
import path from 'path'
import assert from 'assert'

import type { ProjectShape } from '../data/coreDataShape'
import type { DataContext } from '..'
import { hasNonExampleSpec } from '../codegen'
import templates from '../codegen/templates'
import { insertValuesInConfigFile, toPosix } from '../util'
import { getError } from '@packages/errors'
import { resetIssuedWarnings } from '@packages/config'
import type { RunSpecErrorCode } from '@packages/graphql/src/schemaTypes'
import debugLib from 'debug'

export class RunSpecError extends Error {
  constructor (public code: typeof RunSpecErrorCode[number], msg: string) {
    super(msg)
  }
}

export interface ProjectApiShape {
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  openProjectCreate(args: InitializeProjectOptions, options: OpenProjectLaunchOptions): Promise<unknown>
  launchProject(browser: FoundBrowser, spec: Cypress.Spec, options?: Partial<OpenProjectLaunchOpts>): Promise<void>
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
  getCurrentProjectSavedState(): AllowedState | undefined
  setPromptShown(slug: string): void
  setProjectPreferences(stated: AllowedState): void
  makeProjectSavedState(projectRoot: string): void
  getDevServer (): {
    updateSpecs(specs: SpecWithRelativeRoot[]): void
    start(options: {specs: Cypress.Spec[], config: FullConfig}): Promise<{port: number}>
    close(): void
    emitter: EventEmitter
  }
  isListening: (url: string) => Promise<void>
  resetBrowserTabsForNextSpec(shouldKeepTabOpen: boolean): Promise<void>
  resetServer(): void
  runSpec(spec: Cypress.Spec): Promise<void>
  routeToDebug(runNumber: number): void
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

const debug = debugLib('cypress:data-context:ProjectActions')

export class ProjectActions {
  /**
   * @var globalLaunchCount
   * Used as a read-only in the launchpad to ensure
   * that launchProject is only called once if
   * the --browser flag is passed alone.
   */
  private globalLaunchCount = 0
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearCurrentProject () {
    // Clear data associated with local project
    this.ctx.update((d) => {
      d.activeBrowser = null
      d.currentProject = null
      d.diagnostics = {
        error: null,
        warnings: [],
      }

      d.currentTestingType = null
      d.forceReconfigureProject = null
      d.scaffoldedFiles = null
      d.app.browserStatus = 'closed'
      d.app.browserUserAgent = null
    })

    // Also clear any data associated with the linked cloud project
    this.ctx.actions.cloudProject.clearCloudProject()

    this.ctx.actions.migration.reset()
    await this.ctx.lifecycleManager.clearCurrentProject()
    resetIssuedWarnings()
    await this.api.closeActiveProject()
  }

  private set projects (projects: ProjectShape[]) {
    this.ctx.update((d) => {
      d.app.projects = projects
    })
  }

  get launchCount () {
    return this.globalLaunchCount
  }

  set launchCount (count) {
    this.globalLaunchCount = count
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

  async initializeProjectSetup (type: TestingType) {
    await this.ctx.lifecycleManager.initializeProjectSetup(type)
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

    return this.projects = [...projectRoots]
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
          await this.ctx.actions.project.launchProject(this.ctx.coreData.currentTestingType)
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

  async launchProject (testingType: Cypress.TestingType | null, options?: Partial<OpenProjectLaunchOpts>, specPath?: string | null) {
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

    let activeSpec: Cypress.Spec | undefined

    if (specPath) {
      activeSpec = specPath === RUN_ALL_SPECS_KEY ? RUN_ALL_SPECS : this.ctx.project.getCurrentSpecByAbsolute(specPath)
    }

    // launchProject expects a spec when opening browser for url navigation.
    // We give it an template spec if none is passed so as to land on home page
    const emptySpec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: testingType === 'e2e' ? 'integration' : 'component',
    }

    // Used for run-all-specs feature
    if (options?.shouldLaunchNewTab) {
      await this.api.resetBrowserTabsForNextSpec(true)
      this.api.resetServer()
    }

    await this.api.launchProject(browser, activeSpec ?? emptySpec, options)
    this.globalLaunchCount++

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

  setSpecs (specs: SpecWithRelativeRoot[]) {
    this.ctx.project.setSpecs(specs)
    this.refreshSpecs(specs)

    // only check for non-example specs when the specs change
    this.hasNonExampleSpec().then((result) => {
      this.ctx.project.setHasNonExampleSpec(result)
    })
    .catch((e) => {
      this.ctx.project.setHasNonExampleSpec(false)
      this.ctx.logTraceError(e)
    })

    if (this.ctx.coreData.currentTestingType === 'component') {
      this.api.getDevServer().updateSpecs(specs)
    }

    this.ctx.emitter.specsChange()
  }

  refreshSpecs (specs: SpecWithRelativeRoot[]) {
    this.ctx.lifecycleManager.git?.setSpecs(specs.map((s) => s.absolute))
  }

  setProjectPreferencesInGlobalCache (args: MutationSetProjectPreferencesInGlobalCacheArgs) {
    if (!this.ctx.currentProject) {
      throw Error(`Cannot save preferences without currentProject.`)
    }

    this.api.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, args)
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
    await this.ctx.actions.wizard.initialize()
    this.ctx.actions.electron.refreshBrowserWindow()
    this.ctx.actions.electron.showBrowserWindow()
  }

  async hasNonExampleSpec () {
    const specs = this.ctx.project.specs?.map((spec) => spec.relativeToCommonRoot)

    switch (this.ctx.coreData.currentTestingType) {
      case 'e2e':
        return hasNonExampleSpec(templates.e2eExamples, specs)
      case 'component':
        return specs.length > 0
      case null:
        return false
      default:
        throw new Error(`Unsupported testing type ${this.ctx.coreData.currentTestingType}`)
    }
  }

  async pingBaseUrl () {
    const baseUrl = (await this.ctx.project.getConfig())?.baseUrl

    // Should never happen
    if (!baseUrl) {
      return
    }

    const baseUrlWarning = this.ctx.coreData.diagnostics.warnings.find((e) => e.cypressError.type === 'CANNOT_CONNECT_BASE_URL_WARNING')

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

  async runSpec ({ specPath }: { specPath: string}) {
    const waitForBrowserToOpen = async () => {
      const browserStatusSubscription = this.ctx.emitter.subscribeTo('browserStatusChange', { sendInitial: false })

      // Wait for browser to finish launching. Browser is either launched from scratch
      // or relaunched when switching testing types - we need to wait in either case
      // We wait a maximum of 3 seconds so we don't block indefinitely in case something
      // goes sideways with the browser launch process. This is broken up into three
      // separate 'waits' in case we have to watch a browser relaunch (close > opening > open)
      debug('Waiting for browser to report `open`')
      let maxIterations = 3

      while (this.ctx.coreData.app.browserStatus !== 'open') {
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, 1000)),
          browserStatusSubscription.next(),
        ])

        if (--maxIterations === 0) {
          break
        }
      }

      await browserStatusSubscription.return(undefined as any)
    }

    try {
      if (!this.ctx.currentProject) {
        throw new RunSpecError('NO_PROJECT', 'A project must be open prior to attempting to run a spec')
      }

      if (!specPath) {
        throw new RunSpecError('NO_SPEC_PATH', '`specPath` must be a non-empty string')
      }

      let targetTestingType: TestingType

      // Get relative path from the specPath to determine which testing type from the specPattern
      const relativeSpecPath = path.relative(this.ctx.currentProject, specPath)

      // Check to see whether input specPath matches the specPattern for one or the other testing type
      // If it matches neither then we can't run the spec and we should error
      if (await this.ctx.project.matchesSpecPattern(relativeSpecPath, 'e2e')) {
        targetTestingType = 'e2e'
      } else if (await this.ctx.project.matchesSpecPattern(relativeSpecPath, 'component')) {
        targetTestingType = 'component'
      } else {
        throw new RunSpecError('NO_SPEC_PATTERN_MATCH', 'Unable to determine testing type, spec does not match any configured specPattern')
      }

      debug(`Spec %s matches '${targetTestingType}' pattern`, specPath)

      debug('Attempting to launch spec %s', specPath)

      // Look to see if there's actually a file at the target location
      // This helps us avoid switching testingType *then* finding out the spec doesn't exist
      if (!this.ctx.fs.existsSync(specPath)) {
        throw new RunSpecError('SPEC_NOT_FOUND', `No file exists at path ${specPath}`)
      }

      // We now know what testingType we need to be in - if we're already there, great
      // If not, verify that type is configured then switch (or throw an error if not configured)
      if (this.ctx.coreData.currentTestingType !== targetTestingType) {
        if (!this.ctx.lifecycleManager.isTestingTypeConfigured(targetTestingType)) {
          throw new RunSpecError('TESTING_TYPE_NOT_CONFIGURED', `Input path matched specPattern for '${targetTestingType}' testing type, but it is not configured.`)
        }

        debug('Setting testing type to %s', targetTestingType)

        const specChangeSubscription = this.ctx.emitter.subscribeTo('specsChange', { sendInitial: false })

        const originalTestingType = this.ctx.coreData.currentTestingType

        // Temporarily toggle testing type so the `activeBrowser` can be initialized
        // for the targeted testing type. Browser has to be initialized prior to our "relaunch"
        // call below - this can be an issue when Cypress is still on the launchpad and no
        // browser has been launched yet
        this.ctx.lifecycleManager.setCurrentTestingType(targetTestingType)
        await this.ctx.lifecycleManager.setInitialActiveBrowser()
        this.ctx.lifecycleManager.setCurrentTestingType(originalTestingType)

        // This is the magic sauce - we now have a browser selected, so this will toggle
        // the testing type, trigger specs to update, and launch the browser
        await this.switchTestingTypesAndRelaunch(targetTestingType)

        await waitForBrowserToOpen()

        // When testing type changes we need to wait for the specWatcher to trigger and load new specs
        // otherwise our call to `getCurrentSpecByAbsolute` below will fail
        // Wait a maximum of 2 seconds just in case something breaks with the event subscription
        // so we don't block indefinitely
        debug('Waiting for specs to finish loading')
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, 2000)),
          specChangeSubscription.next(),
        ])

        // Close out subscription
        await specChangeSubscription.return(undefined)
      } else {
        debug('Already in %s testing mode', targetTestingType)
      }

      // This accounts for an edge case where a testing type has been previously opened, but
      // the user then backs out to the testing type selector in launchpad. In that scenario,
      // the testingType switch logic above does not trigger the browser to open, so we do it
      // manually here
      if (this.ctx.coreData.app.browserStatus === 'closed') {
        debug('No browser instance, launching...')
        await this.ctx.lifecycleManager.setInitialActiveBrowser()

        await this.api.launchProject(
          this.ctx.coreData.activeBrowser!,
          {
            name: '',
            absolute: '',
            relative: '',
            specType: targetTestingType === 'e2e' ? 'integration' : 'component',
          },
        )

        debug('Browser launched')
      } else {
        debug(`Browser already running, status ${this.ctx.coreData.app.browserStatus}`)

        if (this.ctx.coreData.app.browserStatus !== 'open') {
          await waitForBrowserToOpen()
        }
      }

      // Now that we're in the correct testingType, verify the requested spec actually exists
      // We don't have specs available until a testingType is loaded, so even through we validated
      // a matching file exists above it may not end up loading as a valid spec so we validate that here
      //
      // Have to use toPosix here to align windows absolute paths with how the absolute path is storied in the data context
      const spec = this.ctx.project.getCurrentSpecByAbsolute(toPosix(specPath))

      if (!spec) {
        debug(`Spec not found with path: ${specPath}`)
        throw new RunSpecError('SPEC_NOT_FOUND', `Unable to find matching spec with path ${specPath}`)
      }

      const browser = this.ctx.coreData.activeBrowser!

      // Hooray, everything looks good and we're all set up
      // Try to launch the requested spec by navigating to it in the browser
      await this.api.runSpec(spec)

      return {
        testingType: targetTestingType,
        browser,
        spec,
      }
    } catch (err) {
      if (!(err instanceof RunSpecError)) {
        debug('Unexpected error during `runSpec` %o', err)
      }

      return {
        code: err instanceof RunSpecError ? err.code : 'GENERAL_ERROR',
        detailMessage: err.message,
      }
    }
  }

  async debugCloudRun (runNumber: number) {
    debug('attempting to switch to run #%s', runNumber)
    await this.ctx.relevantRuns.moveToRun(runNumber, this.ctx.git?.currentHashes || [])
    debug('navigating to Debug page')
    this.api.routeToDebug(runNumber)
  }
}
