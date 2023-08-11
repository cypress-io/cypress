import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin shadow dom', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="shadow-dom-link"]').click()
  })

  it('.shadow()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#shadow-element-1').shadow().find('p.shadow-1')
      .should('have.text', 'Shadow Content 1')
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

    it('.shadow()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#shadow-element-1').shadow()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('shadow', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('shadow')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('CY-TEST-ELEMENT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('shadow-element-1')

        expect(consoleProps.props.Yielded).to.be.null
      })
    })
  })
})
