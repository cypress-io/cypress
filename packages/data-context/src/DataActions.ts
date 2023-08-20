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
  ServersActions,
  CohortsActions,
  CodegenActions,
  CloudProjectActions,
} from './actions'
import { ErrorActions } from './actions/ErrorActions'
import { EventCollectorActions } from './actions/EventCollectorActions'
import { NotificationActions } from './actions/NotificationActions'
import { VersionsActions } from './actions/VersionsActions'
import { cached } from './util'

export class DataActions {
  constructor (private ctx: DataContext) {}

  @cached
  get error () {
    return new ErrorActions(this.ctx)
  }

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
  get migration () {
    return new MigrationActions(this.ctx)
  }

  @cached
  get browser () {
    return new BrowserActions(this.ctx)
  }

  @cached
  get servers () {
    return new ServersActions(this.ctx)
  }

  @cached
  get versions () {
    return new VersionsActions(this.ctx)
  }

  @cached
  get eventCollector () {
    return new EventCollectorActions(this.ctx)
  }

  @cached
  get cohorts () {
    return new CohortsActions(this.ctx)
  }

  @cached
  get codegen () {
    return new CodegenActions(this.ctx)
  }

  @cached
  get notification () {
    return new NotificationActions(this.ctx)
  }

  @cached
  get cloudProject () {
    return new CloudProjectActions(this.ctx)
  }
}
