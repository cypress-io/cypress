import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin assertions', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.should() and .and()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .should('not.be.checked').and('not.be.disabled')
    })
  })

  context('cross-origin AUT errors', () => {
    it('.should() and .and() should work while the aut is cross origin', () => {
      cy.wrap(true)
      .should('be.true').and('not.be.false')
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:added', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.should() and .and()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get(':checkbox[name="colors"][value="blue"]')
        .should('not.be.checked').and('not.be.disabled')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const assertionLogs = findCrossOriginLogs('assert', logs, 'foobar.com')

        expect(assertionLogs[0].consoleProps.props.Message).to.equal('expected <input> not to be checked')
        expect(assertionLogs[1].consoleProps.props.Message).to.equal('expected <input> not to be disabled')

        assertionLogs.forEach(({ $el, consoleProps }) => {
          expect($el.jquery).to.be.ok

          expect(consoleProps.name).to.equal('assert')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props.subject[0]).to.have.property('tagName').that.equals('INPUT')
          expect(consoleProps.props.subject[0]).to.have.property('value').that.equals('blue')
          expect(consoleProps.props.subject[0].getAttribute('name')).to.equal('colors')
        })
      })
    })
  })
})
