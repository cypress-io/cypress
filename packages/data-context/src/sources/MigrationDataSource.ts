import { TestingType, MIGRATION_STEPS } from '@packages/types'
import type chokidar from 'chokidar'
import path from 'path'
import type { DataContext } from '..'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  tryGetDefaultLegacyPluginsFile,
  supportFilesForMigration,
  OldCypressConfig,
  hasSpecFile,
  applyMigrationTransform,
  getStepsForMigration,
  shouldShowRenameSupport,
  getIntegrationFolder,
  getPluginsFile,
  isDefaultTestFiles,
  getComponentTestFilesGlobs,
  getComponentFolder,
  getIntegrationTestFilesGlobs,
  getSpecs,
} from './migration'

import { allowed } from '@packages/config/lib'
import { initOldPlugins } from './migration/plugins'

import type { FilePart } from './migration/format'
import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:MigrationDataSource')

export interface MigrationFile {
  testingType: TestingType
  before: {
    relative: string
    parts: FilePart[]
  }
  after: {
    relative: string
    parts: FilePart[]
  }
}

type MIGRATION_STEP = typeof MIGRATION_STEPS[number]

const flags = {
  hasCustomIntegrationFolder: false,
  hasCustomIntegrationTestFiles: false,

  hasCustomComponentFolder: false,
  hasCustomComponentTestFiles: false,

  hasCustomSupportFile: false,
  hasComponentTesting: true,
  hasE2ESpec: true,
  hasPluginsFile: true,
} as const

export class MigrationDataSource {
  private _config: OldCypressConfig | null = null
  private _configE2e: Omit<OldCypressConfig, 'component' | 'e2e'> | null = null
  private _configComponent: Omit<OldCypressConfig, 'component' | 'e2e'> | null = null
  private _step: MIGRATION_STEP = 'renameAuto'
  filteredSteps: MIGRATION_STEP[] = MIGRATION_STEPS.filter(() => true)

  hasCustomIntegrationFolder: boolean = flags.hasCustomIntegrationFolder
  hasCustomIntegrationTestFiles: boolean = flags.hasCustomIntegrationTestFiles

  hasCustomComponentFolder: boolean = flags.hasCustomComponentFolder
  hasCustomComponentTestFiles: boolean = flags.hasCustomComponentTestFiles

  hasCustomSupportFile: boolean = flags.hasCustomSupportFile
  hasComponentTesting: boolean = flags.hasComponentTesting
  hasE2ESpec: boolean = flags.hasE2ESpec
  hasPluginsFile: boolean = flags.hasPluginsFile

  private componentTestingMigrationWatcher: chokidar.FSWatcher | null = null
  componentTestingMigrationStatus?: ComponentTestingMigrationStatus
  private _oldConfigPromise: Promise<OldCypressConfig> | null = null
  private testTypeConfigPromise: Promise<void> | null = null

  constructor (private ctx: DataContext) { }

  async initialize () {
    // for testing mainly, we want to ensure the flags are reset each test
    this.resetFlags()

    if (!this.ctx.currentProject) {
      throw Error('cannot do migration without currentProject!')
    }

    this._config = null
    this._oldConfigPromise = null
    const configE2e = await this.getE2eConfigObject()
    const configComponent = await this.getComponentConfigObject()

    await this.initializeFlags()

    debug('flags initialized')

    this.filteredSteps = await getStepsForMigration(this.ctx.currentProject, configE2e, configComponent)

    if (!this.filteredSteps[0]) {
      throw Error(`Impossible to initialize a migration. No steps fit the configuration of this project.`)
    }

    this.setStep(this.filteredSteps[0])
  }

  private resetFlags () {
    for (const [k, v] of Object.entries(flags)) {
      this[k as keyof typeof flags] = v
    }
  }

  async getComponentTestingMigrationStatus () {
    debug('getComponentTestingMigrationStatus: start')
    const config = await this.parseCypressJson()

    const componentFolder = getComponentFolder(config)

    if (!config || !this.ctx.currentProject) {
      throw Error('Need currentProject and config to continue')
    }

    // no component folder, so no specs to migrate
    // this should never happen since we never show the
    // component specs migration step ("renameManual")
    if (componentFolder === false) {
      return null
    }

    debug('getComponentTestingMigrationStatus: componentFolder', componentFolder)

    if (!this.componentTestingMigrationWatcher) {
      debug('getComponentTestingMigrationStatus: initializing watcher')
      const onFileMoved = async (status: ComponentTestingMigrationStatus) => {
        this.componentTestingMigrationStatus = status
        debug('getComponentTestingMigrationStatus: file moved %O', status)

        if (status.completed) {
          await this.componentTestingMigrationWatcher?.close()
          this.componentTestingMigrationWatcher = null
        }

        // TODO(lachlan): is this the right place to use the emitter?
        this.ctx.deref.emitter.toLaunchpad()
      }

      const { status, watcher } = await initComponentTestingMigration(
        this.ctx.currentProject,
        componentFolder,
        getComponentTestFilesGlobs(config),
        onFileMoved,
      )

      this.componentTestingMigrationStatus = status
      this.componentTestingMigrationWatcher = watcher
      debug('getComponentTestingMigrationStatus: watcher initialized. Status: %o', status)
    }

    if (!this.componentTestingMigrationStatus) {
      throw Error(`Status should have been assigned by the watcher. Something is wrong`)
    }

    return this.componentTestingMigrationStatus
  }

  async supportFilesForMigrationGuide (): Promise<MigrationFile | null> {
    if (!this.ctx.currentProject) {
      throw Error('Need this.ctx.currentProject')
    }

    const configE2e = await this.getE2eConfigObject()

    debug('supportFilesForMigrationGuide: config %O', configE2e)
    if (!await shouldShowRenameSupport(this.ctx.currentProject, configE2e)) {
      return null
    }

    if (!this.ctx.currentProject) {
      throw Error(`Need this.ctx.projectRoot!`)
    }

    try {
      const supportFiles = await supportFilesForMigration(this.ctx.currentProject)

      debug('supportFilesForMigrationGuide: supportFiles %O', supportFiles)

      return supportFiles
    } catch (err) {
      debug('supportFilesForMigrationGuide: err %O', err)

      return null
    }
  }

  async getSpecsForMigrationGuide (): Promise<MigrationFile[]> {
    if (!this.ctx.currentProject) {
      throw Error(`Need this.ctx.projectRoot!`)
    }

    const configE2e = await this.getE2eConfigObject()
    const configComponent = await this.getComponentConfigObject()

    const integrationSpecFiles = await getSpecs(this.ctx.currentProject, configE2e, 'e2e')
    const componentSpecFiles = await getSpecs(this.ctx.currentProject, configComponent, 'component')

    const canBeAutomaticallyMigrated: MigrationFile[] = integrationSpecFiles.map(applyMigrationTransform)

    const defaultComponentPattern = isDefaultTestFiles(configComponent, 'component')

    // Can only migration component specs if they use the default testFiles pattern.
    if (defaultComponentPattern) {
      canBeAutomaticallyMigrated.push(...componentSpecFiles.map(applyMigrationTransform))
    }

    return canBeAutomaticallyMigrated
  }

  async getConfig () {
    const config = await this.parseCypressJson()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject!')
    }

    const { hasTypescript } = this.ctx.lifecycleManager.metaState

    debug('createConfigString', { hasTypescript })

    const jsonConfig = await this.parseCypressJson()
    const configE2e = await this.getE2eConfigObject()
    const configComponent = await this.getComponentConfigObject()

    const config = { ...jsonConfig,
      integrationFolder: configE2e.integrationFolder ?? jsonConfig.integrationFolder,
      componentFolder: configComponent.componentFolder ?? jsonConfig.componentFolder,
      e2e: {
        ...jsonConfig.e2e || {},
        testFiles: configE2e.testFiles,
        supportFile: configE2e.supportFile,
      },
      component: {
        ...jsonConfig.component || {},
        testFiles: configComponent.testFiles,
        supportFile: configComponent.supportFile,
      },
    }

    debug('createConfigString: config %O', config)

    return createConfigString(config, {
      hasComponentTesting: this.hasComponentTesting,
      hasE2ESpec: this.hasE2ESpec,
      hasPluginsFile: this.hasPluginsFile,
      projectRoot: this.ctx.currentProject,
      hasTypescript,
    })
  }

  async integrationFolder () {
    const config = await this.getE2eConfigObject()

    return getIntegrationFolder(config)
  }

  async componentFolder () {
    const config = await this.getComponentConfigObject()

    return getComponentFolder(config)
  }

  private async getE2eConfigObject (): Promise<OldCypressConfig> {
    if (this._configE2e) {
      this._configE2e
    }

    if (!this.testTypeConfigPromise) {
      this.testTypeConfigPromise = this.initializeTestTypesConfig()
    }

    await this.testTypeConfigPromise

    this.testTypeConfigPromise = null

    return this._configE2e || {}
  }

  private async getComponentConfigObject (): Promise<OldCypressConfig> {
    if (this._configComponent) {
      this._configComponent
    }

    if (!this.testTypeConfigPromise) {
      this.testTypeConfigPromise = this.initializeTestTypesConfig()
    }

    await this.testTypeConfigPromise

    this.testTypeConfigPromise = null

    return this._configComponent || {}
  }

  private async initializeTestTypesConfig () {
    const config = await this.parseCypressJson()

    const { e2e, component } = await this.initializePlugins(config)

    this._configComponent = component || null
    this._configE2e = e2e || null
  }

  private async parseCypressJson (): Promise<OldCypressConfig> {
    if (this._config) {
      return this._config
    }

    // avoid reading the same file over and over again before it was finished reading
    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson && !this._oldConfigPromise) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._oldConfigPromise = this.ctx.file.readJsonFile(cfgPath) as Promise<OldCypressConfig>
    }

    if (this._oldConfigPromise) {
      this._config = await this._oldConfigPromise

      this._oldConfigPromise = null

      return this._config
    }

    return {}
  }

  private async initializeFlags () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject to do migration')
    }

    const config = await this.parseCypressJson()
    const configComponent = await this.getComponentConfigObject()
    const configE2e = await this.getE2eConfigObject()

    this.hasCustomIntegrationTestFiles = !isDefaultTestFiles(config, 'integration')
    this.hasCustomIntegrationFolder = getIntegrationFolder(configE2e) !== 'cypress/integration'

    const componentFolder = getComponentFolder(configComponent)

    this.hasCustomComponentFolder = componentFolder !== 'cypress/component'

    const componentTestFiles = getComponentTestFilesGlobs(configComponent)

    this.hasCustomComponentTestFiles = !isDefaultTestFiles(configComponent, 'component')

    if (componentFolder === false) {
      this.hasComponentTesting = false
    } else {
      this.hasComponentTesting = await hasSpecFile(
        this.ctx.currentProject,
        componentFolder,
        componentTestFiles,
      )
    }

    const integrationFolder = getIntegrationFolder(configE2e)
    const integrationTestFiles = getIntegrationTestFilesGlobs(configE2e)

    if (integrationFolder === false) {
      this.hasE2ESpec = false
    } else {
      this.hasE2ESpec = await hasSpecFile(
        this.ctx.currentProject,
        integrationFolder,
        integrationTestFiles,
      )
    }

    const pluginsFileMissing = (
      (config.e2e?.pluginsFile ?? undefined) === undefined &&
      config.pluginsFile === undefined &&
      !await tryGetDefaultLegacyPluginsFile(this.ctx.currentProject)
    )

    if (getPluginsFile(config) === false || pluginsFileMissing) {
      this.hasPluginsFile = false
    }
  }

  async initializePlugins (cfg: OldCypressConfig): Promise<{e2e: OldCypressConfig, component: OldCypressConfig}> {
    const results: any = {}

    await (['e2e', 'component'] as const).reduce(async (prevPromise, type) => {
      await prevPromise
      // only init plugins with the
      // allowed config values to
      // prevent tampering with the
      // internals and breaking cypress
      const allowedCfg = allowed(cfg)

      debug(`plugin config will start with ${type}: %o`, cfg)

      const modifiedCfg = await initOldPlugins(allowedCfg, {
        projectRoot: this.ctx.lifecycleManager?.projectRoot,
        configFile: path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json'),
        testingType: type,
        onError: (err: Error) => {
          debug('error init plugin : %o', err)
          this.ctx.coreData.baseError = err
        },
        onWarning: () => {},
      })

      debug('plugin config yielded: %o', modifiedCfg)
      results[type] = Object.assign({}, cfg, modifiedCfg || {})

      return
    }, Promise.resolve())

    return results
  }

  get step (): MIGRATION_STEP {
    return this._step
  }

  async closeManualRenameWatcher () {
    if (this.componentTestingMigrationWatcher) {
      debug('setStep: stopping watcher')
      await this.componentTestingMigrationWatcher.close()
      this.componentTestingMigrationWatcher = null
    }
  }

  setStep (step: MIGRATION_STEP) {
    this._step = step
  }
}
