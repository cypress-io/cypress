import Promise from 'bluebird'
import $errUtils from '../cypress/error_utils'

export default class LogGroup {
  private cy
  private subject
  private options

  log

  constructor (cy, userOptions) {
    this.cy = cy

    const current = cy.state('current')

    this.options = {
      name: current.get('name'),
      type: current.get('type'),
      log: true,
      ...userOptions,
      groupStart: true,
    }

    this.options.emitOnly = !this.options.log
    this.subject = userOptions.$el || null
  }

  run (fn) {
    if (!_.isFunction(fn)) {
      // update this to be a logGroup error message
      $errUtils.throwErrByPath('group.invalid_argument', { onFail: this.log })
    }

    return this.cy.then(() => {
      // pull forward the original command's subject to correctly yield the subject in the console
      cy.state('current').set('subject', this.subject)

      this.log = Cypress.log(this.options)

      return Promise.try(fn)
    })
    .then((subject) => {
      if (this.log) {
        this.log.endGroup()
      }

      return subject
    })
  }
}
