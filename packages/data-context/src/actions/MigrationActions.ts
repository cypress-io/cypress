import { MIGRATION_STEPS } from '@packages/types'
import type { DataContext } from '..'
import { moveSpecFiles } from '../util'

type MIGRATION_STEP = typeof MIGRATION_STEPS[number]
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
    // FIXME: stop watchers before migrating
    this.setStep(MIGRATION_STEPS[0])
  }

  async renameSpecFiles () {
    if (!this.ctx.currentProject) {
      throw Error('Need to set currentProject before you can rename files')
    }

    const e2eDirPath = this.ctx.path.join(this.ctx.currentProject, 'cypress', 'integration')

    moveSpecFiles(e2eDirPath).catch((error) => {
      throw error
    })
  }

  async renameSupportFile () {
    // TODO: build rename of support file
    return
  }

  async startWizardReconfiguration () {
    this.ctx.lifecycleManager.initializeConfigWatchers()
    this.ctx.lifecycleManager.refreshMetaState()
    this.ctx.lifecycleManager.setCurrentTestingType('component')
  }

  setStep (step: MIGRATION_STEP) {
    this.ctx.migration.setStep(step)
  }
}
