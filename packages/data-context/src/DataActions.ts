import type { DataContext } from '.'
import { AppActions, ProjectActions, WizardActions } from './actions'
import { AuthActions } from './actions/AuthActions'
import { DataEmitterActions } from './actions/DataEmitterActions'
import { cached } from './util'

export class DataActions {
  constructor (private ctx: DataContext) {}

  @cached
  get app () {
    return new AppActions(this.ctx)
  }

  @cached
  get auth () {
    return new AuthActions(this.ctx)
  }

  @cached
  get wizard () {
    return new WizardActions(this.ctx)
  }

  @cached
  get project () {
    return new ProjectActions(this.ctx)
  }

  @cached
  get emitter () {
    return new DataEmitterActions(this.ctx)
  }
}
