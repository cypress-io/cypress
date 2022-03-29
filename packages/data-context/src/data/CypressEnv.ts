import fs from 'fs-extra'
import { getError } from '@packages/errors'

type CypressEnvOptions = {
  envFilePath: string
  validateConfigFile: (file: string | false, config: Cypress.ConfigOptions) => void
}

export class CypressEnv {
  private _cypressEnvPromise: Promise<Cypress.ConfigOptions> | undefined
  private _error: Error | undefined

  constructor (private options: CypressEnvOptions) {}

  async loadCypressEnvFile (): Promise<Cypress.ConfigOptions> {
    if (!this._cypressEnvPromise) {
      this._cypressEnvPromise = this.readAndValidateCypressEnvFile()
    }

    return this._cypressEnvPromise
  }

  private async readAndValidateCypressEnvFile () {
    const cypressEnv = await this.readCypressEnvFile()

    this.options.validateConfigFile(this.options.envFilePath, cypressEnv)

    return cypressEnv
  }

  private async readCypressEnvFile (): Promise<Cypress.ConfigOptions> {
    try {
      return await fs.readJSON(this.options.envFilePath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {}
      }

      if (err.isCypressErr) {
        throw err
      }

      throw getError('ERROR_READING_FILE', this.options.envFilePath, err)
    }
  }
}
