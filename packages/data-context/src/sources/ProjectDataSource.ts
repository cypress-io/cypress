import type { FullConfig } from '@packages/types'
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

  get currentSpec () {
    return this.ctx.activeProject?.currentSpec
  }

  getConfig (projectRoot: string) {
    return this.configLoader.load(projectRoot)
  }

  private configLoader = this.ctx.loader<string, FullConfig>((projectRoots) => {
    return Promise.all(projectRoots.map((root) => this.ctx._apis.projectApi.getConfig(root)))
  })

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
