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

export class DataActions {
  private _error: ErrorActions
  private _file: FileActions
  private _dev: DevActions
  private _app: AppActions
  private _auth: AuthActions
  private _localSettings: LocalSettingsActions
  private _wizard: WizardActions
  private _project: ProjectActions
  private _electron: ElectronActions
  private _migration: MigrationActions
  private _browser: BrowserActions
  private _servers: ServersActions
  private _versions: VersionsActions
  private _eventCollector: EventCollectorActions
  private _cohorts: CohortsActions
  private _codegen: CodegenActions
  private _notification: NotificationActions
  private _cloudProject: CloudProjectActions

  constructor (private ctx: DataContext) {
    this._error = new ErrorActions(this.ctx)
    this._file = new FileActions(this.ctx)
    this._dev = new DevActions(this.ctx)
    this._app = new AppActions(this.ctx)
    this._auth = new AuthActions(this.ctx)
    this._localSettings = new LocalSettingsActions(this.ctx)
    this._wizard = new WizardActions(this.ctx)
    this._project = new ProjectActions(this.ctx)
    this._electron = new ElectronActions(this.ctx)
    this._migration = new MigrationActions(this.ctx)
    this._browser = new BrowserActions(this.ctx)
    this._servers = new ServersActions(this.ctx)
    this._versions = new VersionsActions(this.ctx)
    this._eventCollector = new EventCollectorActions(this.ctx)
    this._cohorts = new CohortsActions(this.ctx)
    this._codegen = new CodegenActions(this.ctx)
    this._notification = new NotificationActions(this.ctx)
    this._cloudProject = new CloudProjectActions(this.ctx)
  }

  get error () {
    return this._error
  }

  get file () {
    return this._file
  }

  get dev () {
    return this._dev
  }

  get app () {
    return this._app
  }

  get auth () {
    return this._auth
  }

  get localSettings () {
    return this._localSettings
  }

  get wizard () {
    return this._wizard
  }

  get project () {
    return this._project
  }

  get electron () {
    return this._electron
  }

  get migration () {
    return this._migration
  }

  get browser () {
    return this._browser
  }

  get servers () {
    return this._servers
  }

  get versions () {
    return this._versions
  }

  get eventCollector () {
    return this._eventCollector
  }

  get cohorts () {
    return this._cohorts
  }

  get codegen () {
    return this._codegen
  }

  get notification () {
    return this._notification
  }

  get cloudProject () {
    return this._cloudProject
  }
}
