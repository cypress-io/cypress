import type { FullConfig } from '@packages/types'
import type { DataContext } from '..'

export class ProjectConfigDataSource {
  constructor (private ctx: DataContext) {}

  async getBaseConfig () {
    if (!this.ctx.activeProject?.configChildProcess) {
      return null
    }

    return this.ctx.activeProject.configChildProcess.resolvedBaseConfig
  }

  async getOrCreateBaseConfig () {
    const configChildProcess = this.ctx.activeProject?.configChildProcess

    if (!configChildProcess) {
      return this.ctx.actions.projectConfig.refreshProjectConfig()
    }
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
