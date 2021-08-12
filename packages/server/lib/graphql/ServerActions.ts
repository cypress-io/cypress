import type { NxsMutationArgs } from 'nexus-decorators'
import { ProjectBase } from '../project-base'
import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions, Run, Viewer } from '@packages/graphql'

// @ts-ignore
import user from '@packages/server/lib/user'

// @ts-ignore
import auth from '@packages/server/lib/gui/auth'

// @ts-ignore
import api from '@packages/server/lib/api'

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

  async authenticate () {
    const viewer: AuthenticatedUser = await auth.start(() => {}, 'launchpad')

    this.ctx.viewer = new Viewer(this.ctx, viewer)
  }

  async logout () {
    await user.logOut()
    this.ctx.viewer = undefined
  }

  async getRuns ({ projectId, authToken }: { projectId: string, authToken: string }): Promise<Run[]> {
    console.log('Calling getRuns')
    const runs = await api.getProjectRuns(projectId, authToken)
    return runs.map(x => new Run({ id: x.id }))
  }
}
