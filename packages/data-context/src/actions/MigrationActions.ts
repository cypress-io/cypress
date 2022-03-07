import path from 'path'
import { fork } from 'child_process'
import type { ForkOptions } from 'child_process'
import assert from 'assert'
import type { DataContext } from '..'
import {
  cleanUpIntegrationFolder,
  formatConfig,
  moveSpecFiles,
  NonStandardMigrationError,
  SpecToMove,
} from '../sources'
import {
  tryGetDefaultLegacyPluginsFile,
  supportFilesForMigration,
  hasSpecFile,
  getStepsForMigration,
  getIntegrationFolder,
  getPluginsFile,
  isDefaultTestFiles,
  getComponentTestFilesGlobs,
  getComponentFolder,
  getIntegrationTestFilesGlobs,
  getSpecPattern,
} from '../sources/migration'

export function processConfigViaLegacyPlugins (projectRoot: string, legacyConfig: Partial<Cypress.Config>): Promise<Partial<Cypress.Config>> {
  return new Promise(async (resolve, reject) => {
    const pluginFile = legacyConfig.pluginsFile ?? await tryGetDefaultLegacyPluginsFile(projectRoot)

    // couldn't find a pluginsFile
    // just bail with initial config
    if (!pluginFile) {
      return resolve(legacyConfig)
    }

    const cwd = path.join(projectRoot, pluginFile)

    const childOptions: ForkOptions = {
      stdio: 'inherit',
      cwd: path.dirname(cwd),
      env: process.env,
    }

    const configProcessArgs = ['--projectRoot', projectRoot, '--file', cwd]
    const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')
    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    proc.addListener('message', ({ event, args }: { event: 'ready' | 'loadLegacyPlugins:reply', args: [{ config: Partial<Partial<Cypress.Config>> }] }) => {
      if (event === 'ready') {
        proc.send({ event: 'loadLegacyPlugins', args: [legacyConfig] })
      } else if (event === 'loadLegacyPlugins:reply') {
        resolve(args[0].config)
        proc.kill()
      } else if (event === 'childProcess:unhandledError') {
        reject(args)
      } else {
        throw Error(`Got unexpected event from ipc: ${event}`)
      }
    })

    return
  })
}

export class MigrationActions {
  private _oldConfigPromise: Promise<Partial<Cypress.Config>> | null = null

  constructor (private ctx: DataContext) { }

  async initialize (config: Partial<Cypress.Config>) {
    const legacyConfigForMigration = await this.setLegacyConfigForMigration(config)
    console.log({legacyConfigForMigration })

    // for testing mainly, we want to ensure the flags are reset each test
    this.resetFlags()

    if (!this.ctx.currentProject || !legacyConfigForMigration) {
      throw Error('cannot do migration without currentProject!')
    }

    await this.initializeFlags()

    const filteredSteps = await getStepsForMigration(this.ctx.currentProject, legacyConfigForMigration)

    this.ctx.update((coreData) => {
      if (!filteredSteps[0]) {
        throw Error(`Impossible to initialize a migration. No steps fit the configuration of this project.`)
      }

      coreData.migration.filteredSteps = filteredSteps
      coreData.migration.step = filteredSteps[0]
    })

  }

  /**
   * Figure out all the data required for the migration UI.
   * This drives which migration steps need be shown and performed.
   */
  private async initializeFlags () {
    const legacyConfigForMigration = this.ctx.coreData.migration.legacyConfigForMigration
    if (!this.ctx.currentProject || !legacyConfigForMigration) {
      throw Error('Need currentProject to do migration')
    }

    const integrationFolder = getIntegrationFolder(legacyConfigForMigration)
    const integrationTestFiles = getIntegrationTestFilesGlobs(legacyConfigForMigration)

    const hasCustomIntegrationFolder = getIntegrationFolder(legacyConfigForMigration) !== 'cypress/integration'
    const hasCustomIntegrationTestFiles = !isDefaultTestFiles(legacyConfigForMigration, 'integration')

    let hasE2ESpec = integrationFolder
      ? await hasSpecFile(this.ctx.currentProject, integrationFolder, integrationTestFiles)
      : false

    // if we don't find specs in the 9.X scope,
    // let's check already migrated files.
    // this allows users to stop migration halfway,
    // then to pick up where they left migration off
    if (!hasE2ESpec && (!hasCustomIntegrationTestFiles || !hasCustomIntegrationFolder)) {
      const newE2eSpecPattern = getSpecPattern(legacyConfigForMigration, 'e2e')

      hasE2ESpec = await hasSpecFile(this.ctx.currentProject, '', newE2eSpecPattern)
    }

    const componentFolder = getComponentFolder(legacyConfigForMigration)
    const componentTestFiles = getComponentTestFilesGlobs(legacyConfigForMigration)

    const hasCustomComponentFolder = componentFolder !== 'cypress/component'
    const hasCustomComponentTestFiles = !isDefaultTestFiles(legacyConfigForMigration, 'component')

    const hasComponentTesting = componentFolder
      ? await hasSpecFile(this.ctx.currentProject, componentFolder, componentTestFiles)
      : false
    
    this.ctx.update((coreData) => {
      coreData.migration.flags = {
        hasCustomIntegrationFolder,
        hasCustomIntegrationTestFiles,
        hasCustomComponentFolder,
        hasCustomComponentTestFiles,
        hasCustomSupportFile: false,
        hasComponentTesting,
        hasE2ESpec,
        hasPluginsFile: true, // TODO
      }
    })

    // // We cannot check already migrated component specs since it would pick up e2e specs as well
    // // the default specPattern for CT is **/*.cy.js.
    // // since component testing has to be re-installed anyway, we can just skip this
    // const pluginsFileMissing = (
    //   (legacyConfigForMigration.e2e?.pluginsFile ?? undefined) === undefined &&
    //   legacyConfigForMigration.pluginsFile === undefined &&
    //   !await tryGetDefaultLegacyPluginsFile(this.ctx.currentProject)
    // )

    // if (getPluginsFile(this.legacyConfig) === false || pluginsFileMissing) {
    //   this.hasPluginsFile = false
    // }
  }

  async createConfigFile () {
    const config = await this.ctx.migration.createConfigString()

    await this.ctx.fs.writeFile(this.ctx.lifecycleManager.configFilePath, config).catch((error) => {
      throw error
    })

    await this.ctx.actions.file.removeFileInProject('cypress.json').catch((error) => {
      throw error
    })
  }

  async setLegacyConfigForMigration (config: Partial<Cypress.Config>) {
    assert(this.ctx.currentProject)
    const legacyConfigForMigration = await processConfigViaLegacyPlugins(this.ctx.currentProject, config)
    this.ctx.update((coreData) => {
      coreData.migration.legacyConfigForMigration = legacyConfigForMigration
    })
    return legacyConfigForMigration
  }

  async parseLegacyConfig (): Promise<Partial<Cypress.Config>> {
    // avoid reading the same file over and over again before it was finished reading
    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson && !this._oldConfigPromise) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._oldConfigPromise = this.ctx.file.readJsonFile(cfgPath) as Promise<Partial<Cypress.Config>>
    }

    if (this._oldConfigPromise) {
      const _legacyConfig = await this._oldConfigPromise

      this._oldConfigPromise = null

      return _legacyConfig
    }

    return {}
  }

  async renameSpecsFolder () {
    if (!this.ctx.currentProject) {
      throw Error('Need to set currentProject before you can rename specs folder')
    }

    const projectRoot = this.ctx.path.join(this.ctx.currentProject)
    const from = path.join(projectRoot, 'cypress', 'integration')
    const to = path.join(projectRoot, 'cypress', 'e2e')

    await this.ctx.fs.move(from, to)
  }

  async renameSpecFiles (beforeSpecs: string[], afterSpecs: string[]) {
    if (!this.ctx.currentProject) {
      throw Error('Need to set currentProject before you can rename files')
    }

    const specsToMove: SpecToMove[] = []

    for (let i = 0; i < beforeSpecs.length; i++) {
      const from = beforeSpecs[i]
      const to = afterSpecs[i]

      if (!from || !to) {
        throw Error(`Must have matching to and from. Got from: ${from} and to: ${to}`)
      }

      specsToMove.push({ from, to })
    }

    const projectRoot = this.ctx.path.join(this.ctx.currentProject)

    await moveSpecFiles(projectRoot, specsToMove)
    await cleanUpIntegrationFolder(this.ctx.currentProject)
  }

  async renameSupportFile () {
    if (!this.ctx.currentProject) {
      throw Error(`Need current project before starting migration!`)
    }

    const result = await supportFilesForMigration(this.ctx.currentProject)

    const beforeRelative = result.before.relative
    const afterRelative = result.after.relative

    if (!beforeRelative || !afterRelative) {
      throw new NonStandardMigrationError('support')
    }

    this.ctx.fs.renameSync(
      path.join(this.ctx.currentProject, beforeRelative),
      path.join(this.ctx.currentProject, afterRelative),
    )
  }

  async finishReconfigurationWizard () {
    this.ctx.lifecycleManager.initializeConfigWatchers()
    this.ctx.lifecycleManager.refreshMetaState()
    await this.ctx.lifecycleManager.reloadConfig()
  }

  async nextStep () {
    const filteredSteps = this.ctx.coreData.migration.filteredSteps
    const index = filteredSteps.indexOf(this.ctx.migration.step)

    if (index === -1) {
      throw new Error('Invalid step')
    }

    const nextIndex = index + 1

    if (nextIndex < filteredSteps.length) {
      const nextStep = filteredSteps[nextIndex]

      if (nextStep) {
        this.ctx.update((coreData) => {
          coreData.migration.step = nextStep
        })
      }
    } else {
      await this.finishReconfigurationWizard()
    }
  }

  async closeManualRenameWatcher () {
    await this.ctx.migration.closeManualRenameWatcher()
  }

  async assertSuccessfulConfigMigration (configExtension: 'js' | 'ts' | 'coffee' = 'js') {
    const actual = formatConfig(await this.ctx.actions.file.readFileInProject(`cypress.config.${configExtension}`))
    const expected = formatConfig(await this.ctx.actions.file.readFileInProject(`expected-cypress.config.${configExtension}`))

    if (actual !== expected) {
      throw Error(`Expected ${actual} to equal ${expected}`)
    }
  }

  async assertSuccessfulConfigScaffold (configFile: `cypress.config.${'js'|'ts'}`) {
    assert(this.ctx.currentProject)

    // we assert the generated configuration file against one from a project that has
    // been verified to run correctly.
    // each project has an `unconfigured` and `configured` variant in `system-tests/projects`
    // for example vueclivue2-configured and vueclivue2-unconfigured.
    // after setting the project up with the launchpad, the two projects should contain the same files.

    const configuredProject = this.ctx.project.projectTitle(this.ctx.currentProject).replace('unconfigured', 'configured')
    const expectedProjectConfig = path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects', configuredProject, configFile)

    const actual = formatConfig(await this.ctx.actions.file.readFileInProject(configFile))
    const expected = formatConfig(await this.ctx.fs.readFile(expectedProjectConfig, 'utf8'))

    if (actual !== expected) {
      throw Error(`Expected ${actual} to equal ${expected}`)
    }
  }

  resetFlags () {
    this.ctx.update((coreData) => {
      coreData.migration.flags = {
        hasCustomIntegrationFolder: false,
        hasCustomIntegrationTestFiles: false,
        hasCustomComponentFolder: false,
        hasCustomComponentTestFiles: false,
        hasCustomSupportFile: false,
        hasComponentTesting: true,
        hasE2ESpec: true,
        hasPluginsFile: true,
      }
    })
  }
}
