import type { TestingType, MIGRATION_STEPS } from '@packages/types'
import type chokidar from 'chokidar'
import type { DataContext } from '..'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  tryGetDefaultLegacyPluginsFile,
  supportFilesForMigration,
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
import pDefer from 'p-defer'

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


export class MigrationDataSource {
  private componentTestingMigrationWatcher: chokidar.FSWatcher | null = null
  componentTestingMigrationStatus?: ComponentTestingMigrationStatus

  constructor (private ctx: DataContext) { }

  get legacyConfig () {
    if (!this.ctx.coreData.migration.legacyConfigForMigration) {
      throw Error(`Expected _legacyConfig to be set. Did you forget to call MigrationDataSource#initialize?`)
    }

    return this.ctx.coreData.migration.legacyConfigForMigration
  }

  async getComponentTestingMigrationStatus () {
    debug('getComponentTestingMigrationStatus: start')
    const componentFolder = getComponentFolder(this.legacyConfig)

    if (!this.legacyConfig || !this.ctx.currentProject) {
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
        getComponentTestFilesGlobs(this.legacyConfig),
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

    debug('supportFilesForMigrationGuide: config %O', this.legacyConfig)
    if (!await shouldShowRenameSupport(this.ctx.currentProject, this.legacyConfig)) {
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

    const specs = await getSpecs(this.ctx.currentProject, this.legacyConfig)

    const canBeAutomaticallyMigrated: MigrationFile[] = specs.integration.map(applyMigrationTransform).filter((spec) => spec.before.relative !== spec.after.relative)

    const defaultComponentPattern = isDefaultTestFiles(this.legacyConfig, 'component')

    // Can only migration component specs if they use the default testFiles pattern.
    if (defaultComponentPattern) {
      canBeAutomaticallyMigrated.push(...specs.component.map(applyMigrationTransform).filter((spec) => spec.before.relative !== spec.after.relative))
    }

    return canBeAutomaticallyMigrated
  }

  async createConfigString () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject!')
    }

    const { hasTypescript } = this.ctx.lifecycleManager.metaState

    return createConfigString(this.legacyConfig, {
      hasComponentTesting: this.ctx.coreData.migration.flags.hasComponentTesting,
      hasE2ESpec: this.ctx.coreData.migration.flags.hasE2ESpec,
      hasPluginsFile: this.ctx.coreData.migration.flags.hasPluginsFile,
      projectRoot: this.ctx.currentProject,
      hasTypescript,
    })
  }

  async integrationFolder () {
    return getIntegrationFolder(this.legacyConfig)
  }

  async componentFolder () {
    return getComponentFolder(this.legacyConfig)
  }

  async closeManualRenameWatcher () {
    if (this.componentTestingMigrationWatcher) {
      await this.componentTestingMigrationWatcher.close()
      this.componentTestingMigrationWatcher = null
    }
  }
}
