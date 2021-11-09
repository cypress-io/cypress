import type { FullConfig } from '@packages/types'
import type { DataContext } from '..'

export class ConfigDataSource {
  constructor (private ctx: DataContext) {}

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

  async cleanupCachedConfigForActiveProject () {
    if (!this.ctx.coreData.currentProject?.config) {
      return
    }

    this.ctx.coreData.currentProject.config = null
  }
}
