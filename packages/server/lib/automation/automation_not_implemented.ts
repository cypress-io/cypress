const AutomationNotImplementedKind = 'AutomationNotImplemented'

export class AutomationNotImplemented extends Error {
  readonly kind = AutomationNotImplementedKind
  constructor (message: string, automationType: string, ...args) {
    super(`Automation command '${message}' not implemented by ${automationType}`)
  }
  static isAutomationNotImplementedErr (e: any): e is AutomationNotImplemented {
    return e?.kind === AutomationNotImplementedKind
  }
}
