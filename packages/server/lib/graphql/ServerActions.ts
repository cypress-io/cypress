import type { NxsMutationArgs } from 'nexus-decorators'
import { ProjectBase } from '../project-base'
import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions, User } from '@packages/graphql'

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
    const user: AuthenticatedUser = await auth.start(() => {}, 'launchpad')

    this.ctx.user = new User(user)
  }

  async logout () {
    await user.logOut()
    this.ctx.user = undefined
  }

  async getRuns ({ projectId }: { projectId: string }) {
    const runs = await api.getProjectRuns(projectId, this.ctx.user?.authToken)

    /* eslint-disable-next-line no-console */
    console.log({ runs })
  }
}
