import { ServerActions } from '../actions/ServerActions'
import { BaseContext } from './BaseContext'

export class ServerContext extends BaseContext {
  readonly actions = new ServerActions(this)
}
