import type { TestingType } from '@packages/types'
import type chokidar from 'chokidar'
import type { DataContext } from '..'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  supportFilesForMigration,
  getSpecs,
  applyMigrationTransform,
  shouldShowRenameSupport,
  getIntegrationFolder,
  isDefaultTestFiles,
  getComponentTestFilesGlobs,
  getComponentFolder,
} from './migration'
import _ from 'lodash'

import type { FilePart } from './migration/format'
import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:MigrationDataSource')

export type LegacyCypressConfigJson = Partial<{
  component: Omit<LegacyCypressConfigJson, 'component' | 'e2e'>
  e2e: Omit<LegacyCypressConfigJson, 'component' | 'e2e'>
  pluginsFile: string | false
  supportFile: string | false
  slowTestThreshold: number
  componentFolder: string | false
  integrationFolder: string
  testFiles: string | string[]
  ignoreTestFiles: string | string[]
}>

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

    return this.checkAndUpdateDuplicatedSpecs(canBeAutomaticallyMigrated)
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

  get configFileNameAfterMigration () {
    return this.ctx.lifecycleManager.legacyConfigFile.replace('.json', `.config.${this.ctx.lifecycleManager.fileExtensionToUse}`)
  }

  private checkAndUpdateDuplicatedSpecs (specs: MigrationFile[]) {
    const updatedSpecs: MigrationFile[] = []
    const updatesCount: Record<string, number> = {}

    const sortedSpecs = this.sortSpecsByExtension(specs)

    sortedSpecs.forEach((spec) => {
      const specExist = _.find(updatedSpecs, (x) => x.after.relative === spec.after.relative)

      let updatedSpec = spec

      if (specExist) {
        const updatedParts = spec.after.parts.map((part) => {
          if (part.group === 'fileName') {
            const beforePreExtensionProperty = _.find(spec.before.parts, (x) => x.group === 'preExtension')
            const beforePreExtension = beforePreExtensionProperty?.text?.replace('.', '')

            updatesCount[spec.after.relative] = (updatesCount[spec.after.relative] ?? 1) + 1

            return {
              ...part,
              text: `${part.text}${updatesCount[spec.after.relative]}${beforePreExtension}`,
              highlight: true,
            }
          }

          return part
        })

        updatedSpec = {
          ...spec,
          after: {
            ...spec.after,
            parts: updatedParts,
            relative: updatedParts.map((x) => x.text).join(''),
          },
        }
      }

      updatedSpecs.push(updatedSpec)
    })

    return updatedSpecs
  }

  private sortSpecsByExtension (specs: MigrationFile[]) {
    const sortedExtensions = ['.spec.', '.Spec.', '_spec.', '_Spec.', '-spec.', '-Spec.', '.test.', '.Test.', '_test.', '_Test.', '-test.', '-Test.']

    return specs.sort(function (a, b) {
      function getExtIndex (spec: string) {
        let index = -1

        // Sort the specs based on the extension, giving priority to .spec
        sortedExtensions.some((c, i) => {
          if (~spec.indexOf(c)) {
            index = i

            return true
          }

          return false
        })

        return index
      }

      return getExtIndex(a.before.relative) - getExtIndex(b.before.relative)
    })
  }
}
