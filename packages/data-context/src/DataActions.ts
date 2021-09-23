import type { DataContext } from '.'
import { ProjectActions, WizardActions } from './actions'
import { AuthActions } from './actions/AuthActions'
import { cached } from './util'

export class DataActions {
  constructor (private ctx: DataContext) {}

  @cached
  get auth () {
    return new AuthActions(this.ctx, this.ctx._apis.userApi)
  }

  @cached
  get wizard () {
    return new WizardActions(this.ctx)
  }

  @cached
  get project () {
    return new ProjectActions(this.ctx, this.ctx._apis.projectApi)
  }
}
