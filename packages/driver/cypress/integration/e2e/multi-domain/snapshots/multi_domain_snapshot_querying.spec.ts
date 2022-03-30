import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot querying', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.contains()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('contains', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('contains')
        expect(consoleProps['Applied To']).to.be.undefined
        expect(consoleProps.Elements).to.equal(1)
        expect(consoleProps.Content).to.equal('Nested Find')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('nested-find')

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.contains('Nested Find')
    })
  })

  it('.within()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('within', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('within')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.Yielded).to.have.property('id').that.equals('by-id')

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').within(() => {
        cy.get('#input')
      })
    })
  })

  it('.root()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('root', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('root')
        expect(consoleProps.Yielded).to.have.property('tagName').that.equals('HTML')

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.root()
    })
  })
})
