import type { DataContext } from '..'

export class AppDataSource {
  constructor (private ctx: DataContext) {}

  get isGlobalMode () {
    const hasGlobalModeArg = this.ctx.launchArgs.global ?? false
    const isMissingActiveProject = !this.ctx.currentProject

    return hasGlobalModeArg || isMissingActiveProject
  }
}
