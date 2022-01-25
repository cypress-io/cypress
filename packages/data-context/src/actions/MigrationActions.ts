import path from 'path'
import fs from 'fs-extra'
import type { DataContext } from '..'
import {
  moveSpecFiles,
  NonStandardMigrationError,
  supportFilesForMigration,
} from '../util'

export class MigrationActions {
  constructor (private ctx: DataContext) { }

  async createConfigFile () {
    const config = await this.ctx.migration.createConfigString()

    await this.ctx.actions.file.writeFileInProject('cypress.config.js', config).catch((error) => {
      throw error
    })

    await this.ctx.actions.file.removeFileInProject('cypress.json').catch((error) => {
      throw error
    })
  }

  initialize () {
    this.ctx.migration.initialize()
  }

  async renameSpecFiles () {
    if (!this.ctx.currentProject) {
      throw Error('Need to set currentProject before you can rename files')
    }

    const e2eDirPath = this.ctx.path.join(this.ctx.currentProject, 'cypress', 'integration')

    moveSpecFiles(e2eDirPath)
  }

  async renameSupportFile () {
    if (!this.ctx.currentProject) {
      throw Error(`Need current project before starting migration!`)
    }

    const result = await supportFilesForMigration(this.ctx.currentProject)

    const beforeRelative = result.before[0]?.relative
    const afterRelative = result.after[0]?.relative

    if (!beforeRelative || !afterRelative) {
      throw new NonStandardMigrationError('support')
    }

    fs.renameSync(
      path.join(this.ctx.currentProject, beforeRelative),
      path.join(this.ctx.currentProject, afterRelative),
    )
  }

  async startWizardReconfiguration () {
    this.ctx.lifecycleManager.initializeConfigWatchers()
    this.ctx.lifecycleManager.refreshMetaState()
    this.ctx.lifecycleManager.setCurrentTestingType('component')
  }

  nextStep () {
    this.ctx.migration.nextStep()
  }
}
