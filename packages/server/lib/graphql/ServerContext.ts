import { ServerActions } from './ServerActions'
import { Project, BaseContext, User } from '@packages/graphql'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
  user?: User

  projects: Project[] = []
}
