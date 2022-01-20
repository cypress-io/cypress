import path from 'path'
import type { DataContext } from '..'
import { createConfigString } from '../util/migration'

export class MigrationDataSource {
  constructor (private ctx: DataContext) { }

  async getConfig () {
    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    const config = await this.parseCypressConfig()

    return createConfigString(config)
  }

  private parseCypressConfig (): Promise<Cypress.ConfigOptions> | Cypress.ConfigOptions {
    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      return this.ctx.file.readJsonFile(cfgPath)
    }

    return {}
  }
}
