import type { DataContext } from '..'

export class AppDataSource {
  constructor (private ctx: DataContext) {}

  get isGlobalMode () {
    const hasGlobalModeArg = this.ctx.launchArgs.global ?? false
    const isMissingActiveProject = !this.ctx.activeProject

    return hasGlobalModeArg || isMissingActiveProject
  }
}
