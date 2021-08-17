import type { NxsMutationArgs } from 'nexus-decorators'
import fs from 'fs'
import path from 'path'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import { LocalProject } from '../entities/LocalProject'
import { Config } from '../entities/Config'
import type { RunGroup } from '../entities/run'
import type { TestingType } from '../constants'
import type { ProjectBase } from '@packages/server/lib/project-base'

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
  abstract initializePlugins (): Promise<void>
  abstract initializeProject (projectRoot: string, testingType: TestingType, options?: any): Promise<ProjectBase<any>>

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

    const config = new Config({
      projectRoot: input.projectRoot,
      projectId: input.projectId,
    })

    const newProject = new LocalProject(config, this.ctx)

    this.ctx.localProjects.push(newProject)

    return newProject
  }

  abstract setActiveProject (projectRoot: string, testingType: TestingType): Promise<LocalProject>

  abstract getProjectId (projectRoot: string): Promise<string | null>
  abstract createProjectBase(input: NxsMutationArgs<'addProject'>['input']): ProjectContract | Promise<ProjectContract>
  abstract authenticate (): Promise<void>
  abstract logout (): Promise<void>

  abstract getRuns (payload: { projectId: string, authToken: string }): Promise<RunGroup[]>
  abstract getRecordKeys (payload: { projectId: string, authToken: string }): Promise<string[]>
}
