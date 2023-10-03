/* eslint-disable no-dupe-class-members */
import path from 'path'
import debugLib from 'debug'
import { fork } from 'child_process'
import fs from 'fs-extra'
import semver from 'semver'
import type { ForkOptions } from 'child_process'
import assert from 'assert'
import _ from 'lodash'
import type { DataContext } from '..'
import { getError } from '@packages/errors'
import {
  cleanUpIntegrationFolder,
  formatConfig,
  LegacyCypressConfigJson,
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
  isDefaultTestFiles,
  getComponentTestFilesGlobs,
  getComponentFolder,
  getIntegrationTestFilesGlobs,
  getSpecPattern,
  legacyOptions,
  legacyIntegrationFolder,
  getLegacyPluginsCustomFilePath,
} from '../sources/migration'
import { makeCoreData } from '../data'
import { LegacyPluginsIpc } from '../data/LegacyPluginsIpc'
import { hasTypeScriptInstalled, toPosix } from '../util'

const debug = debugLib('cypress:data-context:MigrationActions')

const tsNode = toPosix(require.resolve('@packages/server/lib/plugins/child/register_ts_node'))

export function getConfigWithDefaults (legacyConfig: any) {
  const newConfig = _.cloneDeep(legacyConfig)

  legacyOptions.forEach(({ defaultValue, name }) => {
    if (defaultValue !== undefined && legacyConfig[name] === undefined) {
      newConfig[name] = typeof defaultValue === 'function' ? defaultValue() : defaultValue
    }
  })

  return newConfig
}

export function getDiff (oldConfig: any, newConfig: any) {
  // get all the values updated
  const result: any = _.reduce(oldConfig, (acc: any, value, key) => {
    // ignore values that have been removed
    if (newConfig[key] && !_.isEqual(value, newConfig[key])) {
      acc[key] = newConfig[key]
    }

    return acc
  }, {})

  // get all the values added
  return _.reduce(newConfig, (acc: any, value, key) => {
    // their key is in the new config but not in the old config
    if (!oldConfig.hasOwnProperty(key)) {
      acc[key] = value
    }

    return acc
  }, result)
}

export async function processConfigViaLegacyPlugins (projectRoot: string, legacyConfig: LegacyCypressConfigJson): Promise<LegacyCypressConfigJson> {
  const pluginFile = legacyConfig.pluginsFile
    ? await getLegacyPluginsCustomFilePath(projectRoot, legacyConfig.pluginsFile)
    : await tryGetDefaultLegacyPluginsFile(projectRoot)

  debug('found legacy pluginsFile at %s', pluginFile)

  return new Promise((resolve, reject) => {
    // couldn't find a pluginsFile
    // just bail with initial config
    if (!pluginFile) {
      return resolve(legacyConfig)
    }

    const cwd = path.join(projectRoot, pluginFile)

    const childOptions: ForkOptions = {
      stdio: 'inherit',
      cwd: path.dirname(cwd),
      env: _.omit(process.env, 'CYPRESS_INTERNAL_E2E_TESTING_SELF'),
    }

    const configProcessArgs = ['--projectRoot', projectRoot, '--file', cwd]
    const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

    // use ts-node if they've got typescript installed
    // this matches the 9.x behavior, which is what we want for
    // processing legacy pluginsFile (we never supported `"type": "module") in 9.x.
    if (hasTypeScriptInstalled(projectRoot)) {
      const tsNodeLoader = `--require "${tsNode}"`

      if (!childOptions.env) {
        childOptions.env = {}
      }

      if (childOptions.env.NODE_OPTIONS) {
        childOptions.env.NODE_OPTIONS += ` ${tsNodeLoader}`
      } else {
        childOptions.env.NODE_OPTIONS = tsNodeLoader
      }
    }

    const childProcess = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)
    const ipc = new LegacyPluginsIpc(childProcess)

    childProcess.on('error', (error) => {
      error = getError('LEGACY_CONFIG_ERROR_DURING_MIGRATION', cwd, error)

      reject(error)
      ipc.killChildProcess()
    })

    const legacyConfigWithDefaults = getConfigWithDefaults(legacyConfig)

    ipc.on('ready', () => {
      debug('legacyConfigIpc:ready')
      ipc.send('loadLegacyPlugins', legacyConfigWithDefaults)
    })

    ipc.on('loadLegacyPlugins:reply', (modifiedLegacyConfig) => {
      debug('loadLegacyPlugins:reply')
      const diff = getDiff(legacyConfigWithDefaults, modifiedLegacyConfig)

      // if env is updated by plugins, avoid adding it to the config file
      if (diff.env) {
        delete diff.env
      }

      const legacyConfigWithChanges = _.merge(legacyConfig, diff)

      resolve(legacyConfigWithChanges)
      ipc.killChildProcess()
    })

    ipc.on('loadLegacyPlugins:error', (error) => {
      debug('loadLegacyPlugins:error')
      error = getError('LEGACY_CONFIG_ERROR_DURING_MIGRATION', cwd, error)

      reject(error)
      ipc.killChildProcess()
    })

    ipc.on('childProcess:unhandledError', (error) => {
      debug('childProcess:unhandledError')
      reject(error)
      ipc.killChildProcess()
    })
  })
}

export class MigrationActions {
  constructor (private ctx: DataContext) { }

  async initialize (config: LegacyCypressConfigJson) {
    const legacyConfigForMigration = await this.setLegacyConfigForMigration(config)

    this.reset(legacyConfigForMigration)

    if (!this.ctx.currentProject || !legacyConfigForMigration) {
      throw Error('cannot do migration without currentProject!')
    }

    if (this.ctx.coreData.app.isGlobalMode) {
      const version = await this.locallyInstalledCypressVersion(this.ctx.currentProject)

      if (!version) {
        // Could not resolve Cypress. Unlikely, but they are using a
        // project with Cypress that is nested more deeply than
        // another project, which has a `cypress.json` but has not had
        // it's node_modules installed, or it relies on a global version
        // of Cypress that is missing for whatever reason.
        return this.ctx.onError(getError('MIGRATION_CYPRESS_NOT_FOUND'))
      }

      const currentVersion = (await this.ctx.versions.versionData()).current.version

      // Validate that the project being migrated has a version of Cypress compatible with the version being executed.
      // This handles situations where Cypress is launched in global mode to migrate a project with an older version of
      // Cypress as a dependency which could break the project when launched directly.
      // For example:
      //    Local: 9.6.0     Global: 10.0.0     FAIL
      //    Local: 10.0.1    Global: 10.0.0     PASS
      //    Local: 12.0.0    Global: 12.0.1     FAIL
      if (!semver.satisfies(version, `^${currentVersion}`)) {
        return this.ctx.onError(getError('MIGRATION_MISMATCHED_CYPRESS_VERSIONS', version, currentVersion))
      }
    }

    await this.initializeFlags()

    const legacyConfigFileExist = this.ctx.migration.legacyConfigFileExists()
    const filteredSteps = await getStepsForMigration(this.ctx.currentProject, legacyConfigForMigration, Boolean(legacyConfigFileExist))

    this.ctx.update((coreData) => {
      if (!filteredSteps[0]) {
        throw Error(`Impossible to initialize a migration. No steps fit the configuration of this project.`)
      }

      coreData.migration.filteredSteps = filteredSteps
      coreData.migration.step = filteredSteps[0]
    })
  }

  async locallyInstalledCypressVersion (currentProject: string) {
    try {
      const localCypressPkgJsonPath = require.resolve(path.join('cypress', 'package.json'), {
        paths: [currentProject],
      })
      const localCypressPkgJson = await fs.readJson(path.join(localCypressPkgJsonPath)) as { version: string }

      return localCypressPkgJson?.version ?? undefined
    } catch (e) {
      // node_modules was not found, or some other unexpected error
      // return undefined and surface the correct error.
      return undefined
    }
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

    const hasCustomIntegrationFolder = getIntegrationFolder(legacyConfigForMigration) !== legacyIntegrationFolder
    const hasCustomIntegrationTestFiles = !isDefaultTestFiles(legacyConfigForMigration, 'integration')

    const shouldAddCustomE2ESpecPattern = Boolean(this.ctx.migration.legacyConfigProjectId)

    let hasE2ESpec = integrationFolder
      ? await hasSpecFile(this.ctx.currentProject, integrationFolder, integrationTestFiles)
      : false

    // if we don't find specs in the 9.X scope,
    // let's check already migrated files.
    // this allows users to stop migration halfway,
    // then to pick up where they left migration off
    if (!hasE2ESpec && (!hasCustomIntegrationTestFiles || !hasCustomIntegrationFolder)) {
      const newE2eSpecPattern = getSpecPattern(legacyConfigForMigration, 'e2e', shouldAddCustomE2ESpecPattern)

      hasE2ESpec = await hasSpecFile(this.ctx.currentProject, '', newE2eSpecPattern)
    }

    const componentFolder = getComponentFolder(legacyConfigForMigration)
    const componentTestFiles = getComponentTestFilesGlobs(legacyConfigForMigration)

    const hasCustomComponentFolder = componentFolder !== 'cypress/component'
    const hasCustomComponentTestFiles = !isDefaultTestFiles(legacyConfigForMigration, 'component')

    // A user is considered to "have" component testing if either
    // 1. they have a default component folder (cypress/component) with at least 1 spec file
    // OR
    // 2. they have configured a non-default componentFolder (even if it doesn't have any specs.)
    const hasSpecInDefaultComponentFolder = await hasSpecFile(this.ctx.currentProject, componentFolder, componentTestFiles)
    const hasComponentTesting = (hasCustomComponentFolder || hasSpecInDefaultComponentFolder) ?? false

    this.ctx.update((coreData) => {
      coreData.migration.flags = {
        hasCustomIntegrationFolder,
        hasCustomIntegrationTestFiles,
        hasCustomComponentFolder,
        hasCustomComponentTestFiles,
        hasCustomSupportFile: false,
        hasComponentTesting,
        hasE2ESpec,
        hasPluginsFile: true,
        shouldAddCustomE2ESpecPattern,
      }
    })
  }

  get configFileNameAfterMigration () {
    return this.ctx.migration.legacyConfigFile.replace('.json', `.config.${this.ctx.lifecycleManager.fileExtensionToUse}`)
  }

  async createConfigFile () {
    const config = await this.ctx.migration.createConfigString()

    this.ctx.lifecycleManager.setConfigFilePath(this.configFileNameAfterMigration)

    await this.ctx.fs.writeFile(this.ctx.lifecycleManager.configFilePath, config).catch((error) => {
      throw error
    })

    await this.ctx.actions.file.removeFileInProject(this.ctx.migration.legacyConfigFile).catch((error) => {
      throw error
    })

    if (this.ctx.modeOptions.configFile) {
      // @ts-ignore configFile needs to be updated with the new one, so it finds the correct one
      // with the new file, instead of the deleted one which is not supported anymore
      this.ctx.modeOptions.configFile = this.ctx.migration.configFileNameAfterMigration
    }
  }

  async setLegacyConfigForMigration (config: LegacyCypressConfigJson) {
    assert(this.ctx.currentProject)
    const legacyConfigForMigration = await processConfigViaLegacyPlugins(this.ctx.currentProject, config)

    this.ctx.update((coreData) => {
      coreData.migration.legacyConfigForMigration = legacyConfigForMigration
    })

    return legacyConfigForMigration
  }

  async renameSpecsFolder () {
    if (!this.ctx.currentProject) {
      throw Error('Need to set currentProject before you can rename specs folder')
    }

    const projectRoot = this.ctx.path.join(this.ctx.currentProject)
    const from = path.join(projectRoot, 'cypress', 'integration')
    const to = path.join(projectRoot, 'cypress', 'e2e')

    this.ctx.update((coreData) => {
      coreData.migration.flags = {
        ...coreData.migration.flags,
        shouldAddCustomE2ESpecPattern: true,
      }
    })

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

    await this.ctx.fs.rename(
      path.join(this.ctx.currentProject, beforeRelative),
      path.join(this.ctx.currentProject, afterRelative),
    )
  }

  async finishReconfigurationWizard () {
    this.ctx.lifecycleManager.refreshMetaState()
    await this.ctx.lifecycleManager.refreshLifecycle()
  }

  async nextStep () {
    const filteredSteps = this.ctx.coreData.migration.filteredSteps
    const index = filteredSteps.indexOf(this.ctx.coreData.migration.step)

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

  async assertSuccessfulConfigMigration (migratedConfigFile: string = 'cypress.config.js') {
    const actual = formatConfig(await this.ctx.file.readFileInProject(migratedConfigFile))

    const configExtension = path.extname(migratedConfigFile)
    const expected = formatConfig(await this.ctx.file.readFileInProject(`expected-cypress.config${configExtension}`))

    if (actual !== expected) {
      throw Error(`Expected ${actual} to equal ${expected}`)
    }
  }

  reset (config?: LegacyCypressConfigJson) {
    this.ctx.update((coreData) => {
      coreData.migration = { ...makeCoreData().migration, legacyConfigForMigration: config }
    })
  }
}
