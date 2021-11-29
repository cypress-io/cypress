import type { DataContext } from '.'
import {
  AppActions,
  ApplicationDataActions,
  ProjectConfigDataActions,
  ElectronActions,
  FileActions,
  GlobalProjectActions,
  CurrentProjectActions,
} from './actions'
import { AuthActions } from './actions/AuthActions'
import { DevActions } from './actions/DevActions'
import { LocalSettingsActions } from './actions/LocalSettingsActions'

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
    return this.ctx.project ? new CurrentProjectActions(this.ctx, this.ctx.project) : null
  }

  get localSettings () {
    return new LocalSettingsActions(this.ctx)
  }

  get electron () {
    return new ElectronActions(this.ctx)
  }

  get projectConfig () {
    return this.ctx.project ? new ProjectConfigDataActions(this.ctx, this.ctx.project) : null
  }
}
