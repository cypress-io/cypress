import { ServerActions } from '../actions/ServerActions'
import { Project } from '../entities/Project'
import { BaseContext } from './BaseContext'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)

  projects: Project[] = []
}
