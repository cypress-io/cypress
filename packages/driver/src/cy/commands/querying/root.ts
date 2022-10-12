import $utils from '../../../cypress/utils'

export default (Commands, Cypress, cy, state) => {
  Commands._addQuery('root', function root (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    const log = options.log !== false && Cypress.log({
      timeout: options.timeout,
    })

    this.set('timeout', options.timeout)

    const withinSubject = cy.state('withinSubject')

    return () => {
      cy.ensureCommandCanCommunicateWithAUT()

      const $el = $utils.getSubjectFromChain(withinSubject || [cy.$$('html')], cy)

      log && log.set({
        $el,
        consoleProps: () => {
          return {
            Command: 'root',
            Yielded: $el.get(0),
          }
        },
      })

      return $el
    }
  })
}
