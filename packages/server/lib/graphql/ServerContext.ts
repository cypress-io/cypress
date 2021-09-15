import { ServerActions } from './ServerActions'
import { LocalProject, BaseContext, AuthenticatedUser, DashboardProject, Viewer } from '@packages/graphql'
import type { OpenProjectLaunchOptions, LaunchArgs } from '@packages/types'
import { getProjectRoots } from '@packages/server/lib/cache'

// @ts-ignore
import user from '@packages/server/lib/user'

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

    this._getLocalProjectsFromCache()
  }

  async _getLocalProjectsFromCache () {
    const projectRoots = await getProjectRoots()

    this.localProjects = projectRoots.map((root) => new LocalProject(root, this))
  }

  localProjects: LocalProject[] = []
  dashboardProjects: DashboardProject[] = []
}
