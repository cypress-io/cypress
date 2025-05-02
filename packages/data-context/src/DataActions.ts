import type { DataContext } from '.'
import {
  BrowserActions,
  ErrorActions,
  FileActions,
  LocalSettingsActions,
  ProjectActions,
  WizardActions,
} from './actions'
import { NotificationActions } from './actions/NotificationActions'
import { VersionsActions } from './actions/VersionsActions'

export class DataActions {
  private _browser: BrowserActions
  private _error: ErrorActions
  private _file: FileActions
  private _localSettings: LocalSettingsActions
  private _project: ProjectActions
  private _wizard: WizardActions
  private _notification: NotificationActions
  private _versions: VersionsActions

  constructor (ctx: DataContext) {
    this._browser = new BrowserActions(ctx)
    this._error = new ErrorActions(ctx)
    this._file = new FileActions(ctx)
    this._localSettings = new LocalSettingsActions(ctx)
    this._project = new ProjectActions(ctx)
    this._wizard = new WizardActions(ctx)
    this._notification = new NotificationActions(ctx)
    this._versions = new VersionsActions(ctx)
  }

  get browser () {
    return this._browser
  }

  get error () {
    return this._error
  }

  get file () {
    return this._file
  }

  get localSettings () {
    return this._localSettings
  }

  get project () {
    return this._project
  }

  get wizard () {
    return this._wizard
  }

  get notification () {
    return this._notification
  }

  get versions () {
    return this._versions
  }
}
