import type { FullConfig } from '@packages/types'
import path from 'path'
import type { DataContext } from '..'

export class ConfigDataSource {
  constructor (private ctx: DataContext) {}

  async getConfigOnChildProcess (filename?: string) {
    if (!filename) {
      if (!this.ctx.activeProject?.projectRoot) {
        throw new Error('Filename is required, and a active project must be set to get it')
      }

      const defaultConfigName = await this.getDefaultConfigBasename(this.ctx.activeProject?.projectRoot)

      filename = path.join(this.ctx.activeProject.projectRoot, defaultConfigName)
    }

    const childProcessFilePath = path.join(__dirname, '../../../server/lib/util', 'require_async_child.js')

    const config = await this.ctx.actions.childProcess.fork(filename, childProcessFilePath)

    return config as Cypress.ConfigOptions
  }

  async getConfigForProject (projectRoot: string): Promise<FullConfig> {
    if (!this.ctx.coreData.app.activeProject) {
      throw new Error(`Cannot access config without activeProject`)
    }

    if (!this.ctx.coreData.app.activeProject.config) {
      this.ctx.coreData.app.activeProject.config = Promise.resolve().then(async () => {
        const configFile = await this.ctx.config.getDefaultConfigBasename(projectRoot)

        return this.ctx._apis.projectApi.getConfig(projectRoot, { configFile })
      })
    }

    return this.ctx.coreData.app.activeProject.config
  }

  async getDefaultConfigBasename (projectRoot: string) {
    const cypressConfigFiles = ['cypress.config.js', 'cypress.config.ts']
    const legacyConfigFile = 'cypress.json'

    const filesInProjectDir = await this.ctx.fs.readdir(projectRoot)

    const foundConfigFiles = [...cypressConfigFiles, legacyConfigFile].filter((file) => filesInProjectDir.includes(file))

    if (foundConfigFiles.length === 1) {
      const configFile = foundConfigFiles[0]

      if (!configFile) {
        throw this.ctx._apis.projectApi.error.throw('NO_DEFAULT_CONFIG_FILE_FOUND', projectRoot)
      }

      if (configFile === legacyConfigFile) {
        throw this.ctx._apis.projectApi.error.throw('CONFIG_FILE_MIGRATION_NEEDED', projectRoot, configFile)
      }

      return configFile
    }

    // if we found more than one, throw a language conflict
    if (foundConfigFiles.length > 1) {
      if (foundConfigFiles.includes(legacyConfigFile)) {
        const foundFiles = foundConfigFiles.filter((f) => f !== legacyConfigFile)

        throw this.ctx._apis.projectApi.error.throw('LEGACY_CONFIG_FILE', projectRoot, ...foundFiles)
      }

      throw this.ctx._apis.projectApi.error.throw('CONFIG_FILES_LANGUAGE_CONFLICT', projectRoot, ...foundConfigFiles)
    }

    throw this.ctx._apis.projectApi.error.throw('NO_DEFAULT_CONFIG_FILE_FOUND', projectRoot)
  }

  async cleanupCachedConfigForActiveProject () {
    if (!this.ctx.coreData.app.activeProject?.config) {
      return
    }

    this.ctx.coreData.app.activeProject.config = null
  }
}
