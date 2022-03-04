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
  getSpecs,
  applyMigrationTransform,
  getStepsForMigration,
  shouldShowRenameSupport,
  getIntegrationFolder,
  getPluginsFile,
  isDefaultTestFiles,
  getComponentTestFilesGlobs,
  getComponentFolder,
  getIntegrationTestFilesGlobs,
  getSpecPattern,
} from './migration'

import type { FilePart } from './migration/format'
import Debug from 'debug'
import { getError } from '@packages/errors'

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

  constructor (private ctx: DataContext) { }

  async initialize () {
    // for testing mainly, we want to ensure the flags are reset each test
    this.resetFlags()

    if (!this.ctx.currentProject) {
      throw Error('cannot do migration without currentProject!')
    }

    this._config = null
    this._oldConfigPromise = null
    const config = await this.parseCypressConfig()

    await this.initializeFlags()

    this.filteredSteps = await getStepsForMigration(this.ctx.currentProject, config)

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
    const config = await this.parseCypressConfig()

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

    const config = await this.parseCypressConfig()

    debug('supportFilesForMigrationGuide: config %O', config)
    if (!await shouldShowRenameSupport(this.ctx.currentProject, config)) {
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

    const config = await this.parseCypressConfig()

    const specs = await getSpecs(this.ctx.currentProject, config)

    const canBeAutomaticallyMigrated: MigrationFile[] = specs.integration.map(applyMigrationTransform).filter((spec) => spec.before.relative !== spec.after.relative)

    const defaultComponentPattern = isDefaultTestFiles(await this.parseCypressConfig(), 'component')

    // Can only migration component specs if they use the default testFiles pattern.
    if (defaultComponentPattern) {
      canBeAutomaticallyMigrated.push(...specs.component.map(applyMigrationTransform).filter((spec) => spec.before.relative !== spec.after.relative))
    }

    return canBeAutomaticallyMigrated
  }

  async getConfig () {
    const legacyConfigFileExist = await this.ctx.deref.actions.file.checkIfFileExists(this.ctx.lifecycleManager.legacyConfigFile)

    if (!legacyConfigFileExist) {
      const configFileAfterMigrationExist = await this.ctx.deref.actions.file.checkIfFileExists(this.configFileNameAfterMigration)

      if (configFileAfterMigrationExist) {
        this.ctx.onError(getError('MIGRATION_ALREADY_OCURRED', this.configFileNameAfterMigration, this.ctx.lifecycleManager.legacyConfigFile))

        return
      }
    }

    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject!')
    }

    const { hasTypescript } = this.ctx.lifecycleManager.metaState

    const config = await this.parseCypressConfig()

    return createConfigString(config, {
      hasComponentTesting: this.hasComponentTesting,
      hasE2ESpec: this.hasE2ESpec,
      hasPluginsFile: this.hasPluginsFile,
      projectRoot: this.ctx.currentProject,
      hasTypescript,
    })
  }

  async integrationFolder () {
    const config = await this.parseCypressConfig()

    return getIntegrationFolder(config)
  }

  async componentFolder () {
    const config = await this.parseCypressConfig()

    return getComponentFolder(config)
  }

  private async parseCypressConfig (): Promise<OldCypressConfig> {
    if (this._config) {
      return this._config
    }

    // avoid reading the same file over and over again before it was finished reading
    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson && !this._oldConfigPromise) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, this.ctx.lifecycleManager.legacyConfigFile)

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

    const config = await this.parseCypressConfig()

    const integrationFolder = getIntegrationFolder(config)
    const integrationTestFiles = getIntegrationTestFilesGlobs(config)

    this.hasCustomIntegrationFolder = getIntegrationFolder(config) !== 'cypress/integration'
    this.hasCustomIntegrationTestFiles = !isDefaultTestFiles(config, 'integration')

    if (integrationFolder === false) {
      this.hasE2ESpec = false
    } else {
      this.hasE2ESpec = await hasSpecFile(
        this.ctx.currentProject,
        integrationFolder,
        integrationTestFiles,
      )

      // if we don't find specs in the 9.X scope,
      // let's check already migrated files.
      // this allows users to stop migration halfway,
      // then to pick up where they left migration off
      if (!this.hasE2ESpec && (!this.hasCustomIntegrationTestFiles || !this.hasCustomIntegrationFolder)) {
        const newE2eSpecPattern = getSpecPattern(config, 'e2e')

        this.hasE2ESpec = await hasSpecFile(
          this.ctx.currentProject,
          '',
          newE2eSpecPattern,
        )
      }
    }

    const componentFolder = getComponentFolder(config)
    const componentTestFiles = getComponentTestFilesGlobs(config)

    this.hasCustomComponentFolder = componentFolder !== 'cypress/component'
    this.hasCustomComponentTestFiles = !isDefaultTestFiles(config, 'component')

    if (componentFolder === false) {
      this.hasComponentTesting = false
    } else {
      this.hasComponentTesting = await hasSpecFile(
        this.ctx.currentProject,
        componentFolder,
        componentTestFiles,
      )

      // We cannot check already migrated component specs since it would pick up e2e specs as well
      // the default specPattern for CT is **/*.cy.js.
      // since component testing has to be re-installed anyway, we can just skip this
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

  get configFileNameAfterMigration () {
    return this.ctx.lifecycleManager.legacyConfigFile.replace('.json', `.config.${this.ctx.lifecycleManager.metaState.hasTypescript ? 'ts' : 'js'}`)
  }
}
