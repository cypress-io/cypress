import { ServerActions } from './ServerActions'
import { Project } from '@packages/graphql'
import { BaseContext } from './BaseContext'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)

  projects: Project[] = []
}
