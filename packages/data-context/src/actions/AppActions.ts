import type { DataContext } from '..'

export interface AppApiShape {
  appData: ApplicationDataApiShape
}

export interface ApplicationDataApiShape {
  path(): string
  toHashName(projectRoot: string): string
  ensure(): PromiseLike<unknown>
  remove(): PromiseLike<unknown>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async removeAppDataDir () {
    await this.ctx._apis.appApi.appData.remove()
  }

  async ensureAppDataDirExists () {
    await this.ctx._apis.appApi.appData.ensure()
  }
}
