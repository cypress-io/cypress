import path from 'path'
import type { DataContext } from '..'

type ConfigOptions = {
  global: Record<string, unknown>
  e2e: Record<string, unknown>
  component: Record<string, unknown>
}

export class MigrationDataSource {
  constructor (private ctx: DataContext) { }

  async getConfig () {
    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  private parseCypressConfig (): Promise<Cypress.ConfigOptions> {
    const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

    return this.ctx.file.readJsonFile(cfgPath)
  }

  async createConfigString () {
    const cfg = await this.parseCypressConfig()
    const pluginsPath = this.getPluginRelativePath(cfg)
    const rawConfigObjects = Object.entries(cfg).reduce((acc, [key, val]) => {
      if (key === 'pluginsFile') {
        return acc
      }

      if (key === 'e2e' || key === 'component') {
        acc = { ...acc, [key]: val }
      } else {
        acc = { ...acc, global: { ...acc.global, [key]: val } }
      }

      return acc
    }, { global: {}, e2e: {}, component: {} })

    return this.createCypressConfigJs(rawConfigObjects, pluginsPath)
  }

  private getPluginRelativePath (cfg: Partial<Cypress.ConfigOptions>) {
    const DEFAULT_PLUGIN_PATH = path.normalize('/cypress/plugins/index.js')

    return cfg.pluginsFile ? cfg.pluginsFile : DEFAULT_PLUGIN_PATH
  }

  private formatObjectForConfig (obj: Record<string, unknown>, spaces: number) {
    return JSON.stringify(obj, null, spaces)
    .replace(/"([^"]+)":/g, '$1:') // remove quotes from fields
    .replace(/{|(})$/g, '') // remove opening and closing {}
    .replace(/"/g, '\'') // single quotes
    .trim()
  }

  async createCypressConfigJs (config: ConfigOptions, pluginPath: string) {
    return `const { defineConfig } = require('cypress')

module.export = defineConfig({
  ${this.formatObjectForConfig(config.global, 2)},
  e2e: {
    setupNodeEvents(on, config) {
      require('${pluginPath}')
    }${config.e2e ? `
    ${this.formatObjectForConfig(config.e2e, 4)},` : ''}
  },
  component: {
    setupNodeEvents(on, config) {
      require('${pluginPath}')
    },${config.component ? `
    ${this.formatObjectForConfig(config.component, 4)},` : ''}
  },
})
`
  }
}
