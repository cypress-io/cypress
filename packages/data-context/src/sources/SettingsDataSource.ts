import type { DataContext } from '..'

export class SettingsDataSource {
  constructor (private ctx: DataContext) {}

  readSettingsForProject (projectRoot: string) {
    this.ctx.util.assertAbsolute(projectRoot)
  }
}
