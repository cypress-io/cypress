import { remoteSchemaWrapped, BaseContext, AuthenticatedUser, Project, execute, parse } from '@packages/graphql'

import { ServerActions } from './ServerActions'
import type { OpenProjectLaunchOptions, LaunchArgs } from '@packages/types'

// @ts-ignore
import user from '@packages/server/lib/user'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
  protected _remoteSchema = remoteSchemaWrapped

  constructor (args: LaunchArgs, options: OpenProjectLaunchOptions) {
    super(args, options)

    // TIM(review): This should be injected, we should avoid async feching
    // in constructors like this
    user.get().then((cachedUser: AuthenticatedUser) => {
      // cache returns empty object if user is undefined
      if (cachedUser.authToken) {
        this._authenticatedUser = cachedUser
      }

      Promise.resolve(execute({
        schema: this._remoteSchema,
        document: parse(`{ cloudViewer { id } }`),
        contextValue: this,
      })).then((result) => {
        if (!result.data?.cloudViewer) {
          this._authenticatedUser = null
          user.logOut()
        }
      })
    })
  }

  localProjects: Project[] = []

  delegateToRemoteQueryBatched () {
    return null
  }
}
