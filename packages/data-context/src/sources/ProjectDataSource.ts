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

  getConfig (projectRoot: string) {
    return this.configLoader.load(projectRoot)
  }

  private configLoader = this.ctx.loader<string, FullConfig>((projectRoots) => {
    return Promise.all(projectRoots.map((root) => this.ctx._apis.projectApi.getConfig(root)))
  })

  async isFirstTimeAccessing (projectRoot: string, testingType: 'e2e' | 'component') {
    try {
      const config = await this.ctx.file.readJsonFile<{ e2e?: object, component?: object }>(path.join(projectRoot, 'cypress.json'))
      const type = testingType === 'e2e' ? 'e2e' : 'component'
      const overrides = config[type] || {}

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
