import fs from 'fs-extra'
import { getError } from '@packages/errors'

type CypressEnvOptions = {
  envFilePath: string
  toLaunchpad: (...args: any[]) => void
  validateConfigFile: (file: string | false, config: Cypress.ConfigOptions) => void
}

export class CypressEnv {
  #cypressEnvPromise: Promise<Cypress.ConfigOptions> | undefined

  constructor (private options: CypressEnvOptions) {}

  async loadCypressEnvFile (): Promise<Cypress.ConfigOptions> {
    if (!this.#cypressEnvPromise) {
      this.#cypressEnvPromise = this.#readAndValidateCypressEnvFile()
    }

    return this.#cypressEnvPromise
  }

  async #readAndValidateCypressEnvFile () {
    const cypressEnv = await this.#readCypressEnvFile()

    this.options.validateConfigFile(this.options.envFilePath, cypressEnv)
    this.options.toLaunchpad()

    return cypressEnv
  }

  async #readCypressEnvFile (): Promise<Cypress.ConfigOptions> {
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
