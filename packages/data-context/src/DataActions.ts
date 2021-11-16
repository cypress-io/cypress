import type { DataContext } from '.'
import { AppActions, ElectronActions, FileActions, ProjectActions, WizardActions } from './actions'
import { AuthActions } from './actions/AuthActions'
import { DevActions } from './actions/DevActions'
import { EditorActions } from './actions/EditorActions'
import { cached } from './util'

export class DataActions {
  constructor (private ctx: DataContext) {}

  @cached
  get file () {
    return new FileActions(this.ctx)
  }

  @cached
  get dev () {
    return new DevActions(this.ctx)
  }

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
  get electron () {
    return new ElectronActions(this.ctx)
  }

  @cached
  get editor () {
    return new EditorActions(this.ctx)
  }
}
