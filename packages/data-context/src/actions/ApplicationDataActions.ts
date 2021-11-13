import type { DataContext } from '..'

export interface ApplicationDataApiShape {
  path(): string
  toHashName(projectRoot: string): string
  ensure(): PromiseLike<unknown>
  remove(): PromiseLike<unknown>
}

export class ApplicationDataActions {
  constructor (private ctx: DataContext) {}

  async removeAppDir () {
    await this.ctx._apis.appDataApi.remove()
  }

  async ensureAppDirExists () {
    await this.ctx._apis.appDataApi.ensure()
  }
}
