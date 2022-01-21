import type { TestingType } from '@packages/types'
import type { DataContext } from '..'
import {
  // createConfigString,
  getSpecs,
  RelativeSpecWithTestingType,
  formatMigrationFile,
  FilePart,
  regexps,
  NonSpecFileError,
} from '../util/migration'

interface MigrationSpec {
  testingType: TestingType
  parts: FilePart[]
}

interface SpecsForMigrationUI {
  before: MigrationSpec[]
  after: MigrationSpec[]
}

export class MigrationDataSource {
  private _config: Cypress.ConfigOptions | null = null
  constructor (private ctx: DataContext) { }

  async getSpecsRelativeToFolder () {
    if (!this.ctx.currentProject) {
      throw Error('cannot get specs without a project path')
    }

    const config = await this.ctx.lifecycleManager.getFullInitialConfig()

    return getSpecs(
      this.ctx.currentProject,
      config.componentFolder ? config.componentFolder : null,
      config.integrationFolder ? config.integrationFolder : null,
    )
  }

  async getSpecsForMigrationGuide (): Promise<SpecsForMigrationUI> {
    const specs = await this.getSpecsRelativeToFolder()

    const processSpecs = (regexp: 'beforeRegexp' | 'afterRegexp') => {
      return (acc: MigrationSpec[], x: RelativeSpecWithTestingType) => {
        try {
          return acc.concat({
            testingType: x.testingType,
            parts: formatMigrationFile(x.relative, new RegExp(regexps[x.testingType][regexp])),
          })
        } catch (e) {
          if (e instanceof NonSpecFileError) {
          // it's possible they have a non spec file in their cypress/integration directory,
          // if that happens, we just skip that file and carry on.
            return acc
          }

          throw e
        }
      }
    }

    return {
      before: specs.before.reduce(processSpecs('beforeRegexp'), []),
      after: specs.before.reduce(processSpecs('afterRegexp'), []),
    }
  }

  // async getConfig () {
  //   const config = await this.parseCypressConfig()

  //   return JSON.stringify(config, null, 2)
  // }

  // async createConfigString () {
  //   const config = await this.parseCypressConfig()

  //   return createConfigString(config)
  // }

  // async getIntegrationFolder () {
  //   const config = await this.parseCypressConfig()

  //   if (config.e2e?.integrationFolder) {
  //     return config.e2e.integrationFolder
  //   }

  //   if (config.integrationFolder) {
  //     return config.integrationFolder
  //   }

  //   return 'cypress/integration'
  // }

  // async getComponentFolder () {
  //   const config = await this.parseCypressConfig()

  //   if (config.component?.componentFolder) {
  //     return config.component.componentFolder
  //   }

  //   if (config.componentFolder) {
  //     return config.componentFolder
  //   }

  //   return 'cypress/component'
  // }

  // private async parseCypressConfig (): Promise<Cypress.ConfigOptions> {
  //   if (this._config) {
  //     return this._config
  //   }

  //   if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson) {
  //     const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

  //     this._config = this.ctx.file.readJsonFile(cfgPath) as Cypress.ConfigOptions

  //     return this._config
  //   }

  //   return {}
  // }
}
