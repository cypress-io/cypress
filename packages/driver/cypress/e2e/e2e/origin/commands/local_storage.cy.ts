import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin local storage', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.clearLocalStorage()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('foo', 'bar')
        expect(win.localStorage.getItem('foo')).to.equal('bar')
      })

      cy.clearLocalStorage().should((localStorage) => {
        expect(localStorage.length).to.equal(0)
        expect(localStorage.getItem('foo')).to.be.null
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

    it('.clearLocalStorage()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win) => {
          win.localStorage.setItem('foo', 'bar')
          expect(win.localStorage.getItem('foo')).to.equal('bar')
        })

        cy.clearLocalStorage()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('clearLocalStorage', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('clearLocalStorage')
        expect(consoleProps.Yielded).to.be.null
      })
    })
  })
})
