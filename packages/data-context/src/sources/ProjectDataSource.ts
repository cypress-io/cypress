import path from 'path'

import type { DataContext } from '..'

export class ProjectDataSource {
  constructor (private ctx: DataContext) {}

  projectId (projectRoot: string) {
    return 'TODO'
  }

  projectTitle (projectRoot: string) {
    return 'TODO'
  }

  async isFirstTimeAccessing (projectRoot: string, testingType: 'e2e' | 'component') {
    try {
      const config = await this.ctx.loaders.jsonFile<{e2e?: object, component?: object}>(path.join(projectRoot, 'cypress.json'))
      const type = testingType === 'e2e' ? 'e2e' : 'component'
      const overrides = config[type] || {}

      return Object.keys(overrides).length === 0
    } catch (e) {
      const err = e as Error

      // if they do not have a cypress.json, it's definitely their first time using Cypress.
      if (err.name === 'ENOENT') {
        return true
      }

      // unexpected error
      throw Error(e)
    }
  }
}
