import type { DataContext } from '..'

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
}
