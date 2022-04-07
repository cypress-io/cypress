import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('cross-origin snapshot local storage', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.clearLocalStorage()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('clearLocalStorage', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('clearLocalStorage')
        expect(consoleProps.Yielded).to.be.null

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('foo', 'bar')
        expect(win.localStorage.getItem('foo')).to.equal('bar')
      })

      cy.clearLocalStorage()
    })
  })
})
