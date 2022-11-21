export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('root', function root (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    const log = options.log !== false && Cypress.log({
      timeout: options.timeout,
    })

    this.set('timeout', options.timeout)

    const withinSubject = cy.state('withinSubjectChain')

    return () => {
      Cypress.ensure.commandCanCommunicateWithAUT(cy)

      const $el = cy.getSubjectFromChain(withinSubject || [cy.$$('html')])

      log && cy.state('current') === this && log.set({
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
