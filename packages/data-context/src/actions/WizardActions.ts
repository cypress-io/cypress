import type { DataContext } from '..'

export class WizardActions {
  constructor (private ctx: DataContext) {}

  private get data () {
    return this.ctx.wizardData
  }

  validateManualInstall () {
    //
  }
}
