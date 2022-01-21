import type { MIGRATION_STEPS } from '@packages/types'
import type { DataContext } from '..'

type MIGRATION_STEP = typeof MIGRATION_STEPS[number]
export class MigrationActions {
  constructor (private ctx: DataContext) { }

  async createConfigFile () {
    const config = await this.ctx.migration.createConfigString()

    await this.ctx.actions.file.writeFileInProject('cypress.config.js', config).catch((error) => {
      throw error
    })

    this.ctx.lifecycleManager.refreshMetaState()

    await this.ctx.actions.file.removeFileInProject('cypress.json').catch((error) => {
      throw error
    })
  }

  async renameSpecFiles () {
    // here be dragons
    return
  }

  setStep (step: MIGRATION_STEP) {
    this.ctx.migration.setStep(step)
  }
}
