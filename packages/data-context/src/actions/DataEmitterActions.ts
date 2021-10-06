import type { DataContext } from '..'

export class DataEmitterActions {
  constructor (private ctx: DataContext) {}

  toAll () {
    // this.ctx
  }

  toApp (...args: any[]) {
    // this.ctx
  }

  toLaunchpad (...args: any[]) {
    this.ctx._apis.webContents.send('data-context', ...args)
  }
}
