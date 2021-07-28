import { NxsMutationArgs } from 'nexus-decorators'
import { BaseContext } from '../context/BaseContext'
import { Project } from '../entities/Project'

/**
 * Acts as the contract for all actions, implemented by ServerActions
 * and ClientTestActions
 */
export abstract class BaseActions {
  constructor (protected ctx: BaseContext) {}

  abstract installDependencies (): void

  abstract initializePlugins(): Promise<void>

  /**
   * Adds a new project
   */
  addProject (input: NxsMutationArgs<'addProject'>['input']): Project {
    const existing = this.ctx.projects.find((p) => p.projectRoot === input.projectRoot)

    // If we don't already have a projec
    if (existing) {
      return existing
    }

    const newProject = new Project({ projectRoot: input.projectRoot })

    this.ctx.projects.push(newProject)

    return newProject
  }
}
