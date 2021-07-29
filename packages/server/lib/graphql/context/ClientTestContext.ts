import { ClientTestActions } from '../actions/ClientTestActions'
import { BaseContext } from './BaseContext'

/**
 * A client test context allows us to isolate the behavior of the
 */
export class ClientTestContext extends BaseContext {
  readonly actions = new ClientTestActions(this)
  readonly projects = []
}
