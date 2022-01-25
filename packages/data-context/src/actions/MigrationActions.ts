import type { DataContext } from '..'

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
    // TODO: implement the renaming of spec files here
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

  nextStep () {
    this.ctx.migration.nextStep()
  }
}
