import { curry } from 'lodash'
import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin local storage', () => {
  const session = () => {
    return cy.session('session', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.window().then((win) => {
          win.localStorage.setItem('foo', 'bar')
          document.cookie = 'favorite_food=milkshake; SameSite=None; Secure'
          expect(win.localStorage.getItem('foo')).to.equal('bar')
        })
      })
    })
  }

  it.only('.clearLocalStorage()', () => {
    cy.visit('/fixtures/primary-origin.html')
    session()
    cy.visit('/fixtures/primary-origin.html')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('foo')).to.equal(null)
    })

    cy.getCookies().should('have.length', 0)

    cy.then(async () => {
      const currOriginStorage = await Cypress.session.getStorage()

      expect(currOriginStorage.localStorage).to.have.length(0)

      console.log('currOriginStorage', currOriginStorage)

      const allOriginStorage = await Cypress.session.getStorage({ origin: '*' })

      expect(allOriginStorage.localStorage).to.have.length(1)
      expect(allOriginStorage.localStorage[0].value).to.deep.eq({ foo: 'bar' })

      console.log('allOriginStorage', allOriginStorage)
    })

    cy.log('clear all local storage')
    cy.then(async () => {
      await Cypress.session.clearStorage()

      const currOriginStorage = await Cypress.session.getStorage()

      expect(currOriginStorage.localStorage).to.have.length(0)

      console.log('currOriginStorage', currOriginStorage)

      const allOriginStorage = await Cypress.session.getStorage({ origin: '*' })

      expect(allOriginStorage.localStorage).to.have.length(0)

      console.log('allOriginStorage', allOriginStorage)
    })

    cy.window().then((win) => {
      win.localStorage.setItem('foo', 'bar')
      expect(win.localStorage.getItem('foo')).to.equal(null)
    })

    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.window().then((win) => {
        expect(win.localStorage.getItem('foo')).to.equal('bar')
      })

    //   // cy.clearLocalStorage().should((localStorage) => {
    //   //   expect(localStorage.length).to.equal(0)
    //   //   expect(localStorage.getItem('foo')).to.be.null
    //   // })
    })
  })

  it.only('.clearLocalStorage()', () => {
    cy.window().then((win) => {
      expect(win.localStorage.length).to.equal(0)
    })

    cy.pause()
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    cy.origin('http://foobar.com:3500', () => {
      cy.window().then((win) => {
        expect(win.localStorage.length).to.equal(0)
      })
    })

    session()

    cy.visit('/fixtures/primary-origin.html')

    cy.window().then((win) => {
      expect(win.localStorage.getItem('foo')).to.equal(null)
    })

    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.window().then((win) => {
        expect(win.localStorage.getItem('foo')).to.equal('bar')
      })
    })

    cy.then(async () => {
      const currOriginStorage = await Cypress.session.getStorage()

      expect(currOriginStorage.localStorage).to.have.length(0)

      console.log('currOriginStorage', currOriginStorage)

      const allOriginStorage = await Cypress.session.getStorage({ origin: '*' })

      expect(allOriginStorage.localStorage).to.have.length(1)
      expect(allOriginStorage.localStorage[0].value).to.deep.eq({ foo: 'bar' })

      console.log('allOriginStorage', allOriginStorage)
    })

    // Cypress.session.clearAllSavedSessions()
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.window().then((win) => {
        expect(win.localStorage.getItem('foo')).to.equal(null)
      })

    //   // cy.clearLocalStorage().should((localStorage) => {
    //   //   expect(localStorage.length).to.equal(0)
    //   //   expect(localStorage.getItem('foo')).to.be.null
    //   // })
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
      cy.origin('http://foobar.com:3500', () => {
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
