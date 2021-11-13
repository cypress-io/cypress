import type { DataContext } from '.'
import { AppActions, ApplicationDataActions, ElectronActions, FileActions, CurrentProjectActions, GlobalProjectActions } from './actions'
import { AuthActions } from './actions/AuthActions'
import { DevActions } from './actions/DevActions'

export class DataActions {
  constructor (private ctx: DataContext) {}

  get globalProject () {
    return new GlobalProjectActions(this.ctx)
  }

  get applicationData () {
    return new ApplicationDataActions(this.ctx)
  }

  get file () {
    return new FileActions(this.ctx)
  }

  get dev () {
    return new DevActions(this.ctx)
  }

  get app () {
    return new AppActions(this.ctx)
  }

  get auth () {
    return new AuthActions(this.ctx)
  }

  get currentProject () {
    return this.ctx.currentProject ? new CurrentProjectActions(this.ctx, this.ctx.currentProject) : null
  }

  get electron () {
    return new ElectronActions(this.ctx)
  }
}
