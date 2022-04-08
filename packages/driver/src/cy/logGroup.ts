import { $Command } from '../cypress/command'

export default (Cypress, userOptions: Cypress.LogGroup.Config) => {
  const cy = Cypress.cy

  const shouldEmitLog = userOptions.log === undefined ? true : userOptions.log

  const options: Cypress.InternalLogConfig = {
    ...userOptions,
    instrument: 'command',
    groupStart: true,
    emitOnly: !shouldEmitLog,
  }

  const log = Cypress.log(options)

  // An internal command is inserted to create a divider between
  // commands inside group() callback and commands chained to it.
  const restoreCmdIndex = cy.state('index') + 1

  const endLogGroupCmd = $Command.create({
    name: 'end-logGroup',
    injected: true,
  })

  const forwardYieldedSubject = () => {
    if (log) {
      log.endGroup()
    }

    return endLogGroupCmd.get('prev').get('subject')
  }

  cy.queue.insert(restoreCmdIndex, endLogGroupCmd.set('fn', forwardYieldedSubject))

  return log
}
