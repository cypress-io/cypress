import type { TestingType } from '@packages/types'
import Debug from 'debug'
import path from 'path'
import type { DataContext } from '..'
import {
  createConfigString,
  getSpecs,
  RelativeSpecWithTestingType,
  formatMigrationFile,
  FilePart,
  regexps,
  NonSpecFileError,
} from '../util/migration'

const debug = Debug('cypress:data-context:MigrationDataSource')

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

    const compFolder = await this.getComponentFolder()
    const intFolder = await this.getIntegrationFolder()

    const specs = await getSpecs(this.ctx.currentProject, compFolder, intFolder)

    debug('looked in %s and %s and found %o', compFolder, intFolder, specs)

    return specs
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

    const result: SpecsForMigrationUI = {
      before: specs.before.reduce(processSpecs('beforeRegexp'), []),
      after: specs.after.reduce(processSpecs('afterRegexp'), []),
    }

    if (result.before.length !== result.after.length) {
      throw Error(`Before and after should have same lengths, got ${result.before.length} and ${result.after.length}`)
    }

    return result
  }

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
