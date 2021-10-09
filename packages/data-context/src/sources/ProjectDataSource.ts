import type { FullConfig, ResolvedFromConfig } from '@packages/types'
import path from 'path'

import type { DataContext } from '..'

export class ProjectDataSource {
  constructor (private ctx: DataContext) {}

  async projectId (projectRoot: string) {
    const config = await this.getConfig(projectRoot)

    return config.projectId
  }

  async projectTitle (projectRoot: string) {
    return path.basename(projectRoot)
  }

  getConfig (projectRoot: string) {
    return this.configLoader.load(projectRoot)
  }

  async getResolvedConfigFields (projectRoot: string): Promise<ResolvedFromConfig[]> {
    const config = await this.configLoader.load(projectRoot)

    return Object.entries(config.resolved).map(([key, value]) => {
      if (key === 'env') {
        // @ts-ignore this is a ResolvedFromConfig
        return this.mapEnvResolvedConfigToObj(value)
      }

      return value
    }) as ResolvedFromConfig[]
  }

  private configLoader = this.ctx.loader<string, FullConfig>((projectRoots) => {
    return Promise.all(projectRoots.map((root) => this.ctx._apis.projectApi.getConfig(root)))
  })

  private mapEnvResolvedConfigToObj (config: ResolvedFromConfig): ResolvedFromConfig {
    let envValues = {}

    Object.values(config).forEach((value) => {
      Object.assign(envValues, { [value.field]: value.value }, envValues)
    })

    return {
      value: envValues,
      field: 'env',
      from: 'env',
    }
  }

  async isFirstTimeAccessing (projectRoot: string, testingType: 'e2e' | 'component') {
    try {
      const config = await this.ctx.file.readJsonFile<{ e2e?: object, component?: object }>(path.join(projectRoot, 'cypress.json'))

      // If we have a cypress.json file, even with no overrides, assume that it's not our
      // first time accessing (for now, until the config refactor lands)
      if (testingType === 'e2e') {
        return false
      }

      const overrides = config.component || {}

      return Object.keys(overrides).length === 0
    } catch (e) {
      const err = e as Error & { code?: string }

      // if they do not have a cypress.json, it's definitely their first time using Cypress.
      if (err.code === 'ENOENT') {
        return true
      }

      // unexpected error
      throw err
    }
  }
}
