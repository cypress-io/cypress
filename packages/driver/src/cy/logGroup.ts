import { $Command } from '../cypress/command'
import $errUtils from '../cypress/error_utils'

export default (Cypress, userOptions: Cypress.LogGroup.Config, fn: Cypress.LogGroup.ApiCallback) => {
  const cy = Cypress.cy

  const shouldEmitLog = userOptions.log === undefined ? true : userOptions.log

  const options: Cypress.InternalLogConfig = {
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
