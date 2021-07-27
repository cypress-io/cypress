import { ServerContext } from '../context/ServerContext'
import { BaseActions } from './BaseActions'

/**
 *
 */
export class ServerActions extends BaseActions {
  constructor (protected ctx: ServerContext) {
    super(ctx)
  }

  installDependencies () {
    //
  }
}
