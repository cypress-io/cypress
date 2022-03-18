import _ from 'lodash'

interface InternalRootOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: any
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    root (userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalRootOptions = _.defaults({}, userOptions, { log: true })

      if (options.log !== false) {
        options._log = Cypress.log({
          message: '',
          timeout: options.timeout,
        })
      }

      const log = ($el) => {
        if (options.log) {
          options._log.set({ $el })
        }

        return $el
      }

      const withinSubject = state('withinSubject')

      if (withinSubject) {
        return log(withinSubject)
      }

      return cy.now('get', 'html', { log: false }).then(log)
    },
  })
}
