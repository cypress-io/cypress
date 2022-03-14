import assert from 'assert'
import type { DataContext } from '.'
import {
  LocalSettingsActions,
  AppActions,
  ElectronActions,
  FileActions,
  ProjectActions,
  WizardActions,
  MigrationActions,
  BrowserActions,
  DevActions,
  AuthActions,
} from './actions'
import { VersionsActions } from './actions/VersionsActions'
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
  get localSettings () {
    return new LocalSettingsActions(this.ctx)
  }

  get wizard () {
    assert(this.ctx.lifecycleManager, 'Cannot call wizard actions outside of a project')

    return new WizardActions(this.ctx, this.ctx.lifecycleManager)
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
  get migration () {
    return new MigrationActions(this.ctx)
  }

  @cached
  get browser () {
    return new BrowserActions(this.ctx)
  }

  @cached
  get versions () {
    return new VersionsActions(this.ctx)
  }
}
