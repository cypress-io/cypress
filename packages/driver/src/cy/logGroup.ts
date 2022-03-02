import Promise from 'bluebird'
import $errUtils from '../cypress/error_utils'

export default class LogGroup {
  private cy
  log

  constructor (cy, userOptions) {
    this.cy = cy

    const current = cy.state('current')
    const options = _.defaults({}, userOptions, {
      name: current.get('name'),
      type: current.get('type'),
      log: true,
    })

    this.log = Cypress.log({
      ...options,
      groupStart: true,
      emitOnly: !options.log,
    })
  }

  run (fn) {
    if (!_.isFunction(fn)) {
      // update this to be a logGroup error message
      $errUtils.throwErrByPath('within.invalid_argument', { onFail: this.log })
    }

    return this.cy.then(() => Promise.try(fn))
    .then((subject) => {
      if (this.log) {
        this.log.endGroup()
      }

      return subject
    })
  }
}
