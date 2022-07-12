import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.get()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input')
    })
  })

  it('.contains()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.contains('Nested Find')
    })
  })

  it('.within()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').within(() => {
        cy.get('#input')
      })
    })
  })

  it('.root()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.root().should('match', 'html')
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

    it('.contains()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.contains('Nested Find')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('contains', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('contains')
        expect(consoleProps['Applied To']).to.be.undefined
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Content).to.equal('Nested Find')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('nested-find')
      })
    })

    it('.within()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('#by-id').within(() => {
          cy.get('#input')
        })
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('within', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('within')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('by-id')
      })
    })

    it('.root()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.root()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('root', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('root')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('HTML')
      })
    })
  })
})
