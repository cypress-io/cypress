import path from 'path'
import type { DataContext } from '..'
import { createConfigString } from '../util/migration'

export class MigrationDataSource {
  private _config: Cypress.ConfigOptions | null = null
  constructor (private ctx: DataContext) { }

  async getConfig () {
    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    const config = await this.parseCypressConfig()

    return createConfigString(config)
  }

  async getIntegrationFolder () {
    const config = await this.parseCypressConfig()

    if (config.e2e?.integrationFolder) {
      return config.e2e.integrationFolder
    }

    if (config.integrationFolder) {
      return config.integrationFolder
    }

    return 'cypress/integration'
  }

  async getComponentFolder () {
    const config = await this.parseCypressConfig()

    if (config.component?.componentFolder) {
      return config.component.componentFolder
    }

    if (config.componentFolder) {
      return config.componentFolder
    }

    return 'cypress/component'
  }

  private async parseCypressConfig (): Promise<Cypress.ConfigOptions> {
    if (this._config) {
      return this._config
    }

    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._config = this.ctx.file.readJsonFile(cfgPath) as Cypress.ConfigOptions

      return this._config
    }

    return {}
  }
}
