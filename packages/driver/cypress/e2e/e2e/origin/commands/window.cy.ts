import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin window', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.window()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().should('have.property', 'top')
    })
  })

  it('.document()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
    })
  })

  it('.title()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.title().should('include', 'DOM Fixture')
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

    it('.window()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.window()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('window', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('window')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })

    it('.document()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('document', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('document')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })

    it('.title()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.title()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('title', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('title')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.equal('DOM Fixture')
      })
    })
  })
})
