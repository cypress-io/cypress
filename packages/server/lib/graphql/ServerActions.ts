import type { NxsMutationArgs } from 'nexus-decorators'
import { ProjectBase } from '../project-base'
import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions } from '@packages/graphql'
import { RunGroup } from '@packages/graphql/src/entities/run'

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
    this.ctx.viewer.setAuthenticatedConfig(viewer)
  }

  async logout () {
    await user.logOut()
    this.ctx.viewer.setAuthenticatedConfig(undefined)
  }

  async getRuns ({ projectId, authToken }: { projectId: string, authToken: string }): Promise<RunGroup[]> {
    console.log('Calling getRuns')
    const runs = await api.getProjectRuns(projectId, authToken)
    return runs.map(run => new RunGroup(run))
  }
}
