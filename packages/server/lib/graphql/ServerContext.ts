import { ServerActions } from './ServerActions'
import { Project, BaseContext } from '@packages/graphql'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)

  projects: Project[] = []
}
