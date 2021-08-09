import type { NxsMutationArgs } from 'nexus-decorators'
import fs from 'fs'
import path from 'path'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectBaseContract } from '../contracts/ProjectBaseContract'
import { Project } from '../entities/Project'

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
  async addProject (input: NxsMutationArgs<'addProject'>['input']): Promise<Project> {
    // Prevent adding the existing project again
    const existing = this.ctx.projects.find((p) => p.projectRoot === input.projectRoot)

    if (existing) {
      return existing
    }

    const newProject = new Project({
      isCurrent: input.isCurrent,
      projectRoot: input.projectRoot,
      projectBase: await this.createProjectBase(input),
    })

    this.ctx.projects.push(newProject)

    return newProject
  }

  abstract createProjectBase(input: NxsMutationArgs<'addProject'>['input']): ProjectBaseContract | Promise<ProjectBaseContract>
  abstract authenticate (): Promise<void>
  abstract logout (): Promise<void>
  abstract getRuns ({ projectId }: { projectId: string }): Promise<void>
}
