import { ServerActions } from './ServerActions'
import { LocalProject, BaseContext, AuthenticatedUser, DashboardProject, Viewer } from '@packages/graphql'
import type { OpenProjectLaunchOptions } from '@packages/types'

// @ts-ignore
import user from '@packages/server/lib/user'
import type { LaunchArgs } from '../open_project'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
  viewer: Viewer | null = null

  constructor (args: LaunchArgs, options: OpenProjectLaunchOptions) {
    super(args, options)

    user.get().then((cachedUser: AuthenticatedUser) => {
      // cache returns empty object if user is undefined
      this.viewer = Object.keys(cachedUser).length > 0
        ? new Viewer(this, cachedUser)
        : null
    })
  }

  localProjects: LocalProject[] = []
  dashboardProjects: DashboardProject[] = []
}
