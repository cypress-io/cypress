import { delegateToSchema } from '@graphql-tools/delegate'
import { remoteSchemaWrapped, BaseContext, AuthenticatedUser, Project } from '@packages/graphql'

import { ServerActions } from './ServerActions'

// @ts-ignore
import user from '@packages/server/lib/user'
import type { LaunchArgs } from '../open_project'
import type { OpenProjectLaunchOptions } from '../project-base'
import { GraphQLResolveInfo } from 'graphql'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)

  constructor (args: LaunchArgs, options: OpenProjectLaunchOptions) {
    super(args, options)

    // TIM(review): This should be injected, we should avoid async feching
    // in constructors like this
    user.get().then((cachedUser: AuthenticatedUser) => {
      // cache returns empty object if user is undefined
      if (cachedUser.authToken) {
        this._authenticatedUser = cachedUser
      }
    })
  }

  localProjects: Project[] = []

  delegateToRemoteQuery (info: GraphQLResolveInfo) {
    try {
      return delegateToSchema({
        schema: remoteSchemaWrapped,
        info,
        context: this,
      }) as any
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)
    }

    return null as any
  }

  delegateToRemoteQueryBatched () {
    return null
  }

  batchedCloudExecuteMethod () {
    return null
  }
}
