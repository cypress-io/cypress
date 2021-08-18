import fs from 'fs'
import path from 'path'
import type { BaseContext } from '../context/BaseContext'
import type { RunGroup } from '../entities/run'
import type { FoundBrowser } from '@packages/launcher'
import type { LocalProject } from '../entities'
import type { FullConfig } from '@packages/server/lib/config'

/**
 * Acts as the contract for all actions, inherited by:
 *  - ServerActions
 *  - ClientTestActions
 *
 * By having a "base actions" class, we can reuse this code on the client
 * and make the client-only test doubles work as realistically as possible
 */
export abstract class BaseActions {
  constructor (protected ctx: BaseContext) {}

  abstract installDependencies (): void

  createConfigFile ({ code, configFilename }: { code: string, configFilename: string }): void {
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot create config file without activeProject.`)
    }

    fs.writeFileSync(path.resolve(project.projectRoot, configFilename), code)
  }

  abstract addProject (projectRoot: string): LocalProject

  abstract getProjectId (projectRoot: string): Promise<string | null>
  abstract authenticate (): Promise<void>
  abstract logout (): Promise<void>

  abstract getRuns (payload: { projectId: string, authToken: string }): Promise<RunGroup[]>
  abstract getRecordKeys (payload: { projectId: string, authToken: string }): Promise<string[]>
  abstract getBrowsers (): Promise<FoundBrowser[]>
  abstract initializeConfig (projectRoot: string): Promise<FullConfig>
}
