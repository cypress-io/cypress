import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot window', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.window()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('window', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('window')
        expect(consoleProps.Yielded).to.be.null

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.window()
    })
  })

  it('.document()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('document', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('document')
        expect(consoleProps.Yielded).to.be.null

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.document()
    })
  })

  it('.title()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog } = findCrossOriginLogs('title', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('title')
        expect(consoleProps.Yielded).to.equal('DOM Fixture')

        done()
      }, 250)
    })

    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.title()
    })
  })
})
