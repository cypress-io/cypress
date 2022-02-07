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

export class DataActions {
  constructor (private ctx: DataContext) {}

  readonly file = new FileActions(this.ctx)

  readonly dev = new DevActions(this.ctx)

  readonly app = new AppActions(this.ctx)

  readonly auth = new AuthActions(this.ctx)

  readonly localSettings = new LocalSettingsActions(this.ctx)

  readonly wizard = new WizardActions(this.ctx)

  readonly project = new ProjectActions(this.ctx)

  readonly electron = new ElectronActions(this.ctx)

  readonly migration = new MigrationActions(this.ctx)

  readonly browser = new BrowserActions(this.ctx)
}
