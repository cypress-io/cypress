import { $Command } from '../cypress/command'
import $errUtils from '../cypress/error_utils'
import type { LogConfig } from '../cypress/log'

export interface LogGroupConfig {
  // name of the group - defaults to current command's name
  name?: string
  // additional information to include in the log
  message?: any
  // the JQuery element for the command. This will highlight the command
  // in the main window when debugging
  $el?: JQuery
  // whether or not to emit a log to the UI
  // when disabled, child logs will not be nested in the UI
  log?: boolean
  // timeout of the group command - defaults to defaultCommandTimeout
  timeout?: number
}

export default (Cypress, userOptions: LogGroupConfig, fn: (log) => any) => {
  const cy = Cypress.cy

  const shouldEmitLog = userOptions.log || true

  const options: LogConfig = {
    ...userOptions,
    instrument: 'command',
    groupStart: true,
    emitOnly: !shouldEmitLog,
  }

  const subject = userOptions.$el || null

  const log = Cypress.log(options)

  if (!_.isFunction(fn)) {
    $errUtils.throwErrByPath('group.missing_fn', { onFail: log })
  }

  // An internal command is inserted to create a divider between
  // commands inside group() callback and commands chained to it.
  const restoreCmdIndex = cy.state('index') + 1

  cy.queue.insert(restoreCmdIndex, $Command.create({
    args: [subject],
    name: 'group-restore',
    fn: (subject) => {
      if (log) {
        log.endGroup()
      }

      return subject
    },
  }))

  return fn(log)
}
