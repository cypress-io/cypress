import path from 'path'
import assert from 'assert'
import type { DataContext } from '..'
import {
  cleanUpIntegrationFolder,
  formatConfig,
  moveSpecFiles,
  NonStandardMigrationError,
  SpecToMove,
  supportFilesForMigration,
} from '../sources'

export class MigrationActions {
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

  initialize () {
    return this.ctx.migration.initialize()
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
