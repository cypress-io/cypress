import type { NxsMutationArgs } from 'nexus-decorators'
import { ProjectBase } from '../../project-base'
import { ServerContext } from '../context/ServerContext'
import { BaseActions } from './BaseActions'

/**
 *
 */
export class ServerActions extends BaseActions {
  constructor (protected ctx: ServerContext) {
    super(ctx)
  }

  installDependencies () {
    //
  }

  createProjectBase (input: NxsMutationArgs<'addProject'>['input']) {
    return new ProjectBase({
      projectRoot: input.projectRoot,
      testingType: 'component',
      options: {},
    })
  }
}
