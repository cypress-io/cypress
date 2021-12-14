import type { FullConfig } from '@packages/types'
import path from 'path'
import type { DataContext } from '..'

export class ProjectConfigDataSource {
  constructor (private ctx: DataContext) {}

  async getOrCreateBaseConfig (configFilePath?: string) {
    const configChildProcess = this.ctx.currentProject?.configChildProcess

    if (!configChildProcess) {
      if (!configFilePath) {
        configFilePath = await this.getConfigFilePath()
      }

      return this.ctx.deref.actions.projectConfig.refreshProjectConfig(configFilePath)
    }

    return configChildProcess.resolvedBaseConfig
  }

  async getConfigForProject (projectRoot: string): Promise<FullConfig> {
    if (!this.ctx.coreData.currentProject) {
      throw new Error(`Cannot access config without currentProject`)
    }

    if (!this.ctx.coreData.currentProject.config) {
      this.ctx.coreData.currentProject.config = Promise.resolve().then(async () => {
        const configFile = await this.ctx.config.getDefaultConfigBasename(projectRoot)

        return this.ctx._apis.projectApi.getConfig(projectRoot, { configFile })
      })
    }

    return this.ctx.coreData.currentProject.config
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

  protected async getConfigFilePath () {
    const projectRoot = this.ctx.currentProject?.projectRoot

    if (!projectRoot) {
      throw new Error('Can\'t het the config file path without current project root')
    }

    const defaultConfigBasename = await this.getDefaultConfigBasename(projectRoot)

    return path.join(projectRoot, defaultConfigBasename)
  }
}
