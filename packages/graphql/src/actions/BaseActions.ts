import type { NxsMutationArgs } from 'nexus-decorators'
import fs from 'fs'
import path from 'path'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import { LocalProject } from '../entities/LocalProject'
import { Config } from '../entities/Config'
import type { RunGroup } from '../entities/run'

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

  /**
   * Adds a new project if it doesn't already exist
   */
  async addProject (input: NxsMutationArgs<'addProject'>['input']): Promise<LocalProject> {
    // Prevent adding the existing project again
    const existing = this.ctx.localProjects.find((p) => p.projectRoot === input.projectRoot)

    if (existing) {
      return existing
    }

    const newProject = new LocalProject({
      config: new Config({
        projectRoot: input.projectRoot,
        projectId: input.projectId,
      }),
    })

    this.ctx.localProjects.push(newProject)

    return newProject
  }

  abstract createProjectBase(input: NxsMutationArgs<'addProject'>['input']): ProjectContract | Promise<ProjectContract>
  abstract authenticate (): Promise<void>
  abstract logout (): Promise<void>
  abstract getRuns (payload: { projectId: string, authToken: string }): Promise<RunGroup[]>
}
