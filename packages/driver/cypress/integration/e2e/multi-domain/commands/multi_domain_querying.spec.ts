import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
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
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('contains', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

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
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('within', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

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
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('root', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('root')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('HTML')
      })
    })
  })
})
