import { extendRemoteSubject, isRemoteDriverEnabled } from '../../remote'

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('root', function root (options: Cypress.LogTimeoutOptions) {
    options = options || {}
    const log = Cypress.log({
      timeout: options.timeout,
      hidden: options.log === false,
    })

    this.set('timeout', options.timeout)

    const withinSubject = cy.state('withinSubjectChain')

    if (isRemoteDriverEnabled(Cypress) && !withinSubject) {
      return () => extendRemoteSubject('root', undefined, { type: 'get', selector: 'html' }, 'root')
    }

    return () => {
      Cypress.ensure.commandCanCommunicateWithAUT(cy)

      const $el = cy.getSubjectFromChain(withinSubject || [cy.$$('html')])

      log && cy.state('current') === this && log.set({
        $el,
        consoleProps: () => {
          return {
            name: 'root',
            Yielded: $el.get(0),
          }
        },
      })

      return $el
    }
  })
}
