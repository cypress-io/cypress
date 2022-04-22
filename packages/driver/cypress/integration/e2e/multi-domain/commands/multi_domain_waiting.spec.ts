import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin waiting', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.wait()', () => {
    cy.origin('http://foobar.com:3500', () => {
      const delay = cy.spy(Cypress.Promise, 'delay')

      cy.wait(50).then(() => {
        expect(delay).to.be.calledWith(50, 'wait')
      })
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.wait()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.wait(200)
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('wait', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('wait')
        expect(consoleProps).to.have.property('Waited For').to.equal('200ms before continuing')
      })
    })
  })
})
