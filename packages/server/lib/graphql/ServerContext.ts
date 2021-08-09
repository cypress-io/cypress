import { ServerActions } from './ServerActions'
import { Project, BaseContext, User, AuthenticatedUser } from '@packages/graphql'

// @ts-ignore
import user from '@packages/server/lib/user'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
  user?: User

  constructor () {
    super()

    user.get().then((cachedUser: AuthenticatedUser) => {
      // cache returns empty object if user is undefined
      this.user = Object.keys(cachedUser).length > 0
        ? new User(cachedUser)
        : undefined
    })
  }

  projects: Project[] = []
}
