import { TestingType, MIGRATION_STEPS } from '@packages/types'
import Debug from 'debug'
import type chokidar from 'chokidar'
import path from 'path'
import type { DataContext } from '..'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  getSpecs,
  getDefaultLegacySupportFile,
  supportFilesForMigration,
  OldCypressConfig,
  hasComponentSpecFile,
  GetSpecs
} from '../util/migration'
import {
  formatMigrationFile,
  FilePart,
  regexps,
  NonSpecFileError,
} from '../util/migrationFormat'
import {
  getStepsForMigration,
  shouldShowRenameSupport,
  getIntegrationFolder,
  isDefaultTestFiles,
  getComponentTestFiles,
  getComponentFolder,
  getIntegrationTestFiles
} from './migration/shouldShowSteps'
import globby from 'globby'

const debug = Debug('cypress:data-context:MigrationDataSource')

interface MigrationFile {
  testingType: TestingType
  relative: string
  parts: FilePart[]
}

export interface FilesForMigrationUI {
  before: MigrationFile[]
  after: MigrationFile[]
}

type MIGRATION_STEP = typeof MIGRATION_STEPS[number]

export class MigrationDataSource {
  private _config: OldCypressConfig | null = null
  private _step: MIGRATION_STEP = 'renameAuto'
  filteredSteps: MIGRATION_STEP[] = MIGRATION_STEPS.filter(() => true)

  hasCustomIntegrationFolder: boolean = false
  hasCustomIntegrationTestFiles: boolean = false

  hasCustomComponentFolder: boolean = false
  hasCustomComponentTestFiles: boolean = false

  hasCustomSupportFile = false
  hasComponentTesting: boolean = true

  private componentTestingMigrationWatcher?: chokidar.FSWatcher
  componentTestingMigrationStatus?: ComponentTestingMigrationStatus

  constructor (private ctx: DataContext) { }

  async initialize () {
    if (!this.ctx.currentProject) {
      throw Error('cannot do migration without currentProject!')
    }

    this._config = null
    const config = await this.parseCypressConfig()

    await this.initializeFlags()

    this.filteredSteps = await getStepsForMigration(this.ctx.currentProject, config)

    if (!this.filteredSteps[0]) {
      throw Error(`Impossible to initialize a migration. No steps fit the configuration of this project.`)
    }

    this.setStep(this.filteredSteps[0])
  }

  async getSpecsRelativeToFolder (): Promise<GetSpecs> {
    const currentProject = this.ctx.currentProject

    if (!currentProject) {
      throw Error('cannot get specs without a project path')
    }

    const config = await this.parseCypressConfig()

    const integrationFolder = getIntegrationFolder(config)
    const integrationTestFiles = getIntegrationTestFiles(config)

    if (integrationFolder === false) {
      return {
        before: [],
        after: []
      }
    }

    const files = await globby(
      integrationTestFiles.map(x => path.join(integrationFolder, x)),
    { onlyFiles: true, cwd: currentProject })

    return getSpecs(files)
  }

  async getDefaultLegacySupportFile (): Promise<string> {
    if (!this.ctx.currentProject) {
      throw Error(`Need this.ctx.projectRoot!`)
    }

    return getDefaultLegacySupportFile(this.ctx.currentProject)
  }

  async getComponentTestingMigrationStatus () {
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

    if (!this.componentTestingMigrationWatcher) {
      const onFileMoved = (status: ComponentTestingMigrationStatus) => {
        this.componentTestingMigrationStatus = status

        if (status.completed) {
          this.componentTestingMigrationWatcher?.close()
        }

        // TODO(lachlan): is this the right plcae to use the emitter?
        this.ctx.deref.emitter.toLaunchpad()
      }

      const { status, watcher } = await initComponentTestingMigration(
        this.ctx.currentProject,
        componentFolder,
        getComponentTestFiles(config),
        onFileMoved,
      )

      this.componentTestingMigrationStatus = status
      this.componentTestingMigrationWatcher = watcher
    }

    if (!this.componentTestingMigrationStatus) {
      throw Error(`Status should have been assigned by the watcher. Somethign is wrong`)
    }

    return this.componentTestingMigrationStatus
  }

  async supportFilesForMigrationGuide (): Promise<FilesForMigrationUI | null> {
    const config = await this.parseCypressConfig()

    if (!shouldShowRenameSupport(config)) {
      return null
    }

    if (!this.ctx.currentProject) {
      throw Error(`Need this.ctx.projectRoot!`)
    }

    return supportFilesForMigration(this.ctx.currentProject)
  }

  async getSpecsForMigrationGuide (): Promise<FilesForMigrationUI> {
    const specs = await this.getSpecsRelativeToFolder()
    const integrationFolder = await this.integrationFolder()

    // this should never happen! Cannot migrate if integrationFolder === false.
    // we should not show the step in this case.
    if (integrationFolder === false) {
      return {
        before: [],
        after: []
      }
    }

    const processSpecs = (regexp: 'beforeRegexp' | 'afterRegexp') => {
      return (acc: MigrationFile[], relative: string) => {
        console.log(acc, relative, integrationFolder, regexps.e2e[regexp](integrationFolder))
        try {
          return acc.concat({
            testingType: 'e2e',
            relative,
            parts: formatMigrationFile(relative, new RegExp(regexps.e2e[regexp](integrationFolder))),
          })
        } catch (e) {
          if (e instanceof NonSpecFileError) {
            console.log('asdfasdfsad')
            // it's possible they have a non spec file in their cypress/integration directory,
            // if that happens, we just skip that file and carry on.
            return acc
          }

          throw e
        }
      }
    }

    const result: FilesForMigrationUI = {
      before: specs.before.reduce(processSpecs('beforeRegexp'), []),
      after: specs.after.reduce(processSpecs('afterRegexp'), []),
    }

    if (result.before.length !== result.after.length) {
      throw Error(`Before and after should have same lengths, got ${result.before.length} and ${result.after.length}`)
    }

    return result
  }

  async getConfig () {
    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    const config = await this.parseCypressConfig()

    return createConfigString(config)
  }

  async componentFolder () {
    const config = await this.parseCypressConfig()
    return getComponentFolder(config)
  }

  async integrationFolder () {
    const config = await this.parseCypressConfig()
    return getIntegrationFolder(config)
  }

  async parseCypressConfig (): Promise<OldCypressConfig> {
    if (this._config) {
      return this._config
    }

    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._config = await this.ctx.file.readJsonFile(cfgPath) as OldCypressConfig

      return this._config
    }

    return {}
  }

  private async initializeFlags () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject to do migration')
    }

    const config = await this.parseCypressConfig()

    this.hasCustomIntegrationTestFiles = !isDefaultTestFiles(config, 'integration')
    this.hasCustomIntegrationFolder = getIntegrationFolder(config) !== 'cypress/integration'

    const componentFolder = getComponentFolder(config)

    this.hasCustomComponentFolder = componentFolder !== 'cypress/component'

    const componentTestFiles = getComponentTestFiles(config)

    this.hasCustomComponentTestFiles = !isDefaultTestFiles(config, 'component')

    if (componentFolder === false) {
      this.hasComponentTesting = false
    } else {
      this.hasComponentTesting = await hasComponentSpecFile(
        this.ctx.currentProject,
        componentFolder,
        componentTestFiles,
      )
    }
  }

  get step (): MIGRATION_STEP {
    return this._step
  }

  setStep (step: MIGRATION_STEP) {
    this._step = step
  }
}
