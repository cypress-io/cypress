import _ from 'lodash'

interface InternalRootOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: any
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    root (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const _options: InternalRootOptions = _.defaults({}, options, { log: true })

      if (_options.log !== false) {
        _options._log = Cypress.log({
          message: '',
          timeout: _options.timeout,
        })
      }

      const log = ($el) => {
        if (_options.log) {
          _options._log.set({ $el })
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
