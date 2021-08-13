import { ServerActions } from './ServerActions'
import { LocalProject, BaseContext, AuthenticatedUser, DashboardProject, Viewer } from '@packages/graphql'

// @ts-ignore
import user from '@packages/server/lib/user'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
  viewer: Viewer | null = null

  constructor () {
    super()

    user.get().then((cachedUser: AuthenticatedUser) => {
      // cache returns empty object if user is undefined
      this.viewer = Object.keys(cachedUser).length > 0
        ? new Viewer(this, cachedUser)
        : null

      console.log(this.viewer)
    })
  }

  localProjects: LocalProject[] = []
  dashboardProjects: DashboardProject[] = []
}
