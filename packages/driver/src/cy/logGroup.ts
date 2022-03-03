import Promise from 'bluebird'
import $errUtils from '../cypress/error_utils'

export default (Cypress, userOptions, fn) => {
  let log
  const cy = Cypress.cy
  const current = cy.state('current')

  const options = {
    name: current.get('name'),
    type: current.get('type'),
    log: true,
    ...userOptions,
    groupStart: true,
  }

  options.emitOnly = !options.log

  const subject = userOptions.$el || null

  if (!_.isFunction(fn)) {
    $errUtils.throwErrByPath('group.missing_fn', { onFail: log })
  }

  return cy.then(() => {
    // pull forward the original command's subject to correctly yield the subject in the console
    cy.state('current').set('subject', subject)

    log = Cypress.log(options)

    return Promise.try(() => fn(log))
  })
  .then((subject) => {
    if (log) {
      log.endGroup()
    }

    return subject
  })
}
