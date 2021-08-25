import { ServerActions } from './ServerActions'
import { BaseContext, AuthenticatedUser, Viewer, Project } from '@packages/graphql'

// @ts-ignore
import user from '@packages/server/lib/user'
import type { LaunchArgs } from '../open_project'
import type { OpenProjectLaunchOptions } from '../project-base'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
  viewer: Viewer | null = null

  constructor (args: LaunchArgs, options: OpenProjectLaunchOptions) {
    super(args, options)

    // TIM(review): This should be injected, we should avoid async feching in constructors like this
    user.get().then((cachedUser: AuthenticatedUser) => {
      // cache returns empty object if user is undefined
      this.viewer = Object.keys(cachedUser).length > 0
        ? new Viewer(this, cachedUser)
        : null
    })
  }

  localProjects: Project[] = []

  // batchedCloudExecute (args, info) {
  // }

  // batchedCloudExecuteMethod (args, info) {
  // }
}
