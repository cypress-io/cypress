import { $Command } from '../cypress/command'
import $errUtils from '../cypress/error_utils'

export default (Cypress, userOptions, fn) => {
  const cy = Cypress.cy

  const options = {
    log: true,
    ...userOptions,
    groupStart: true,
  }

  options.emitOnly = !options.log

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
