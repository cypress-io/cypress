import path from 'path'
import type { DataContext } from '..'

export class ProjectConfigDataSource {
  constructor (private ctx: DataContext) {}

  async getDefaultConfigBasename (projectRoot: string) {
    const cypressConfigFiles = ['cypress.config.js', 'cypress.config.ts']
    const legacyConfigFile = 'cypress.json'

    const filesInProjectDir = await this.ctx.fs.readdir(projectRoot)

    const foundConfigFiles = [...cypressConfigFiles, legacyConfigFile].filter((file) => filesInProjectDir.includes(file))

    if (foundConfigFiles.length === 1) {
      const configFile = foundConfigFiles[0]

      if (!configFile) {
        throw this.ctx._apis.projectApi.error('NO_DEFAULT_CONFIG_FILE_FOUND', projectRoot)
      }

      if (configFile === legacyConfigFile) {
        throw this.ctx._apis.projectApi.error('CONFIG_FILE_MIGRATION_NEEDED', projectRoot, configFile)
      }

      return configFile
    }

    // if we found more than one, throw a language conflict
    if (foundConfigFiles.length > 1) {
      if (foundConfigFiles.includes(legacyConfigFile)) {
        const foundFiles = foundConfigFiles.filter((f) => f !== legacyConfigFile)

        throw this.ctx._apis.projectApi.error('LEGACY_CONFIG_FILE', projectRoot, ...foundFiles)
      }

      throw this.ctx._apis.projectApi.error('CONFIG_FILES_LANGUAGE_CONFLICT', projectRoot, ...foundConfigFiles)
    }

    throw this.ctx._apis.projectApi.error('NO_DEFAULT_CONFIG_FILE_FOUND', projectRoot)
  }

  protected async getConfigFilePath () {
    const projectRoot = this.ctx.currentProject?.projectRoot

    if (!projectRoot) {
      throw new Error('Can\'t get the config file path without current project root')
    }

    const defaultConfigBasename = await this.getDefaultConfigBasename(projectRoot)

    return path.join(projectRoot, defaultConfigBasename)
  }
}
