import { ClientTestContext } from '../context/ClientTestContext'
import { BaseActions } from './BaseActions'

export class ClientTestActions extends BaseActions {
  constructor (protected ctx: ClientTestContext) {
    super(ctx)
  }

  installDependencies () {
    return
  }

  initializePlugins () {
    return
  }
}
