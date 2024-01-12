import _ from 'lodash'
import { $Command } from '../cypress/command'
import $errUtils from '../cypress/error_utils'

export default (Cypress, userOptions: Cypress.LogGroup.Config, fn: Cypress.LogGroup.ApiCallback) => {
  const cy = Cypress.cy

  const options: Cypress.InternalLogConfig = {
    ...userOptions,
    instrument: 'command',
    groupStart: true,
    hidden: userOptions.log === false,
  }

  const log = Cypress.log(options)

  if (!_.isFunction(fn)) {
    $errUtils.throwErrByPath('group.missing_fn', { onFail: log })
  }

  // An internal command is inserted to create a divider between
  // commands inside group() callback and commands chained to it.
  const restoreCmdIndex = cy.queue.index + 1

  const endLogGroupCmd = $Command.create({
    name: 'end-logGroup',
    injected: true,
    args: [],
  })

  const forwardYieldedSubject = () => {
    if (log) {
      log.endGroup()
    }

    return endLogGroupCmd.get('prev').get('subject')
  }

  cy.queue.insert(restoreCmdIndex, endLogGroupCmd.set('fn', forwardYieldedSubject))

  return fn(log)
}
