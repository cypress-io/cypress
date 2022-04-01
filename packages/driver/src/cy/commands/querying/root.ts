import _ from 'lodash'

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    // TODO: any -> Partial<Cypress.Loggable & Cypress.Timeoutable>
    root (options: any = {}) {
      const userOptions = options

      options = _.defaults({}, userOptions, { log: true })

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

      return cy.now('get', 'html', {
        log: false,
        timeout: options.timeout,
      }).then(log)
    },
  })
}
