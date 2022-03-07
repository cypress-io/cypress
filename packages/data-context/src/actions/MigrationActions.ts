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
  OldCypressConfig,
  SpecToMove,
  supportFilesForMigration,
  tryGetDefaultLegacyPluginsFile,
} from '../sources'

export function processConfigViaLegacyPlugins (projectRoot: string, legacyConfig: Partial<OldCypressConfig>) {
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

    proc.addListener('message', ({ event, args }: { event: 'ready' | 'loadLegacyPlugins:reply', args: [{ config: Partial<OldCypressConfig> }] }) => {
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
  private _oldConfigPromise: Promise<OldCypressConfig> | null = null

  constructor (private ctx: DataContext) { }

  async createConfigFile () {
    const config = await this.ctx.migration.createConfigString()

    await this.ctx.fs.writeFile(this.ctx.lifecycleManager.configFilePath, config).catch((error) => {
      throw error
    })

    await this.ctx.actions.file.removeFileInProject('cypress.json').catch((error) => {
      throw error
    })
  }

  async parseLegacyConfig (): Promise<OldCypressConfig> {
    // avoid reading the same file over and over again before it was finished reading
    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson && !this._oldConfigPromise) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._oldConfigPromise = this.ctx.file.readJsonFile(cfgPath) as Promise<OldCypressConfig>
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
    const filteredSteps = this.ctx.migration.filteredSteps
    const index = filteredSteps.indexOf(this.ctx.migration.step)

    if (index === -1) {
      throw new Error('Invalid step')
    }

    const nextIndex = index + 1

    if (nextIndex < filteredSteps.length) {
      const nextStep = filteredSteps[nextIndex]

      if (nextStep) {
        this.ctx.migration.setStep(nextStep)
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
}
