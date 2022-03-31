// The type declarations for Cypress Log Group & the corresponding configuration permutations
declare namespace Cypress {
  declare namespace LogGroup {
    type ApiCallback = (log: Cypress.Log) => Chainable<S>
    type LogGroup = (cypress: Cypress.Cypress, options: Partial<LogGroupConfig>, callback: LogGroupCallback) => Chainable<S>
    
    interface Config {
      // the JQuery element for the command. This will highlight the command
      // in the main window when debugging
      $el?: JQuery
      // whether or not to emit a log to the UI
      // when disabled, child logs will not be nested in the UI
      log?: boolean
      // name of the group - defaults to current command's name
      name?: string
      // additional information to include in the log
      message?: string
      // timeout of the group command - defaults to defaultCommandTimeout
      timeout?: number
      type?: Cypress.InternalLogConfig['type']
    }
  }
}
