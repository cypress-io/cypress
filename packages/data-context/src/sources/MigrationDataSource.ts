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
import path from 'path'

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
  env: { [key: string]: any }
  [index: string]: any
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

  get legacyConfigProjectId () {
    return this.legacyConfig.projectId || this.legacyConfig.e2e?.projectId
  }

  get shouldMigratePreExtension () {
    return !this.legacyConfigProjectId
  }

  get legacyConfigFile () {
    if (this.ctx.modeOptions.configFile && this.ctx.modeOptions.configFile.endsWith('.json')) {
      return this.ctx.modeOptions.configFile
    }

    return 'cypress.json'
  }

  legacyConfigFileExists (): boolean {
    // If we aren't in a current project we definitely don't have a legacy config file
    if (!this.ctx.currentProject) {
      return false
    }

    const configFilePath = path.isAbsolute(this.legacyConfigFile) ? this.legacyConfigFile : path.join(this.ctx.currentProject, this.legacyConfigFile)
    const legacyConfigFileExists = this.ctx.fs.existsSync(configFilePath)

    return Boolean(legacyConfigFileExists)
  }

  needsCypressJsonMigration (): boolean {
    const legacyConfigFileExists = this.legacyConfigFileExists()

    return this.ctx.lifecycleManager.metaState.needsCypressJsonMigration && Boolean(legacyConfigFileExists)
  }

  async getVideoEmbedHtml () {
    if (this.ctx.coreData.migration.videoEmbedHtml) {
      return this.ctx.coreData.migration.videoEmbedHtml
    }

    const versionData = await this.ctx.versions.versionData()
    const embedOnLink = `https://on.cypress.io/v13-video-embed/${versionData.current.version}`

    debug(`Getting videoEmbedHtml at link: ${embedOnLink}`)

    // Time out request if it takes longer than 3 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    try {
      const response = await this.ctx.util.fetch(embedOnLink, { method: 'GET', signal: controller.signal })
      const { videoHtml } = await response.json()

      this.ctx.update((d) => {
        d.migration.videoEmbedHtml = videoHtml
      })

      return videoHtml
    } catch {
      // fail silently, no user-facing error is needed
      return null
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getComponentTestingMigrationStatus () {
    debug('getComponentTestingMigrationStatus: start')
    if (!this.legacyConfig || !this.ctx.currentProject) {
      throw Error('Need currentProject and config to continue')
    }

    const componentFolder = getComponentFolder(this.legacyConfig)

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
        this.ctx.emitter.toLaunchpad()
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

    const e2eMigrationOptions = {
      // If the configFile has projectId, we do not want to change the preExtension
      // so, we can keep the cloud history
      shouldMigratePreExtension: this.shouldMigratePreExtension,
    }

    const canBeAutomaticallyMigrated: MigrationFile[] = specs.integration.map((s) => applyMigrationTransform(s, e2eMigrationOptions)).filter((spec) => spec.before.relative !== spec.after.relative)

    const defaultComponentPattern = isDefaultTestFiles(this.legacyConfig, 'component')

    // Can only migration component specs if they use the default testFiles pattern.
    if (defaultComponentPattern) {
      canBeAutomaticallyMigrated.push(...specs.component.map((s) => applyMigrationTransform(s)).filter((spec) => spec.before.relative !== spec.after.relative))
    }

    return this.checkAndUpdateDuplicatedSpecs(canBeAutomaticallyMigrated)
  }

  async createConfigString () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject!')
    }

    const { isUsingTypeScript } = this.ctx.lifecycleManager.metaState

    return createConfigString(this.legacyConfig, {
      hasComponentTesting: this.ctx.coreData.migration.flags.hasComponentTesting,
      hasE2ESpec: this.ctx.coreData.migration.flags.hasE2ESpec,
      hasPluginsFile: this.ctx.coreData.migration.flags.hasPluginsFile,
      projectRoot: this.ctx.currentProject,
      isUsingTypeScript,
      isProjectUsingESModules: this.ctx.lifecycleManager.metaState.isProjectUsingESModules,
      shouldAddCustomE2ESpecPattern: this.ctx.coreData.migration.flags.shouldAddCustomE2ESpecPattern,
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
    return this.legacyConfigFile.replace('.json', `.config.${this.ctx.lifecycleManager.fileExtensionToUse}`)
  }

  private checkAndUpdateDuplicatedSpecs (specs: MigrationFile[]) {
    const updatedSpecs: MigrationFile[] = []

    const sortedSpecs = this.sortSpecsByExtension(specs)

    sortedSpecs.forEach((spec) => {
      const specExist = _.find(updatedSpecs, (x) => x.after.relative === spec.after.relative)

      if (specExist) {
        const beforeParts: FilePart[] = JSON.parse(JSON.stringify(spec.before.parts))
        const preExtensionBefore = beforeParts.find((part) => part.group === 'preExtension')

        if (preExtensionBefore) {
          preExtensionBefore.highlight = false
        }

        const afterParts: FilePart[] = JSON.parse(JSON.stringify(spec.after.parts))
        const fileNameAfter = afterParts.find((part) => part.group === 'fileName')

        if (fileNameAfter && preExtensionBefore) {
          const beforePreExtension = preExtensionBefore?.text?.replace('.', '')

          fileNameAfter.text = `${fileNameAfter.text}${beforePreExtension}`
        }

        spec.before.parts = beforeParts
        spec.after.parts = afterParts
        spec.after.relative = afterParts.map((x) => x.text).join('')
      }

      updatedSpecs.push(spec)
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
