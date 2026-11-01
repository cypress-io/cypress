import { authCreds } from '../../../../fixtures/auth_creds'

describe('remote driver: navigation in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  it('.go()', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy.go('back')
    cy.location('pathname').should('include', 'secondary-origin.html')

    cy.go('forward')
    cy.location('pathname').should('include', 'dom.html')
  })

  it('.go() back onto a cross-origin page from baseUrl', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    cy.visit('/fixtures/generic.html')

    cy.go('back')
    cy.location('href').should('equal', 'http://www.foobar.com:3500/fixtures/secondary-origin.html')
    cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
  })

  it('.go() back onto baseUrl from a cross-origin page', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.go('back')

    cy.location('href').should('equal', 'http://localhost:3500/fixtures/primary-origin.html')
  })

  it('.reload()', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()

    cy.document().invoke('body.setAttribute', 'data-before-reload', 'true')
    cy.get('body').should('have.attr', 'data-before-reload', 'true')

    cy.reload()

    cy.get('body').should('not.have.attr', 'data-before-reload')
  })

  context('.visit()', () => {
    it('fires window:load for each visit', () => {
      const onLoad = cy.spy()

      cy.on('window:load', onLoad)

      cy.visit('/fixtures/primary-origin.html').then(() => {
        expect(onLoad).to.be.calledOnce
      })

      cy.visit('http://www.foobar.com:3500/fixtures/dom.html').then(() => {
        expect(onLoad).to.be.calledTwice
      })
    })

    it('supports visiting baseUrl first', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
    })

    it('supports skipping visiting baseUrl first', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
    })

    it('supports navigating to a cross-origin page through a link and then visiting', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

      cy.visit('http://www.foobar.com:3500/fixtures/dom.html')
      cy.location('href').should('equal', 'http://www.foobar.com:3500/fixtures/dom.html')
    })

    it('resolves a relative url against baseUrl, not the cross-origin AUT', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

      cy.visit('/fixtures/dom.html')
      cy.location('href').should('equal', 'http://localhost:3500/fixtures/dom.html')
    })

    it('supports a hash change within the cross-origin AUT', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html#hashchange')

      cy.location('hash').should('equal', '#hashchange')
    })

    it('navigates back to baseUrl', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')
      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

      cy.visit('/fixtures/primary-origin.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').should('have.text', 'http://www.foobar.com:3500/fixtures/secondary-origin.html')
      cy.location('href').should('equal', 'http://localhost:3500/fixtures/primary-origin.html')
    })

    it('makes a round trip from a cross-origin AUT to baseUrl and back', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')
      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

      cy.visit('/fixtures/primary-origin.html')
      cy.location('href').should('equal', 'http://localhost:3500/fixtures/primary-origin.html')

      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')
      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
    })

    it('succeeds when visiting another cross-origin page from a cross-origin AUT', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.visit('http://www.idp.com:3500/fixtures/dom.html')

      cy.location('href').should('equal', 'http://www.idp.com:3500/fixtures/dom.html')
    })

    it('supports the query string option', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html', { qs: { foo: 'bar' } })

      cy.location('search').should('equal', '?foo=bar')
    })

    it('can send a POST request', () => {
      cy.visit('http://www.foobar.com:3500/post-only', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          bar: 'baz',
        }),
      })

      cy.contains('it worked!').contains('{"bar":"baz"}')
    })

    it('supports redirecting from baseUrl to a cross-origin page', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.visit('http://localhost:3500/redirect?href=http://www.foobar.com:3500/fixtures/secondary-origin.html')
      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
    })

    it('supports redirecting from a cross-origin page to baseUrl', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.visit('http://www.foobar.com:3500/redirect?href=http://localhost:3500/fixtures/generic.html')

      cy.location('href').should('equal', 'http://localhost:3500/fixtures/generic.html')
    })

    it('succeeds when visiting baseUrl from a cross-origin AUT', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

      cy.visit('http://localhost:3500/fixtures/generic.html')

      cy.location('href').should('equal', 'http://localhost:3500/fixtures/generic.html')
    })

    it('supports auth options and adding auth to subsequent requests', () => {
      cy.visit('http://www.foobar.com:3500/basic_auth', { auth: authCreds })

      cy.get('body').should('have.text', 'basic auth worked')

      cy.document().invoke('location.assign', 'http://www.foobar.com:3500/basic_auth')

      cy.get('body').should('have.text', 'basic auth worked')

      // attaches the auth options for the foobar origin even from another origin
      cy.visit('http://www.idp.com:3500/fixtures/primary-origin.html')

      cy.document().invoke('location.assign', 'http://www.foobar.com:3500/basic_auth')

      cy.location('host').should('equal', 'www.foobar.com:3500')
      cy.get('body').should('have.text', 'basic auth worked')

      cy.visit('/fixtures/primary-origin.html')

      // attaches the auth options for the foobar origin from baseUrl
      cy.document().invoke('location.assign', 'http://www.foobar.com:3500/basic_auth')

      cy.location('host').should('equal', 'www.foobar.com:3500')
      cy.get('body').should('have.text', 'basic auth worked')
    })

    it('handles visit failures', (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.include('failed trying to load:\n\nhttp://www.foobar.com:3500/fixtures/secondary-origin.html')
        expect(e.message).to.include('500: Internal Server Error')

        done()
      })

      cy.intercept('*/secondary-origin.html', { statusCode: 500 })

      cy.visit('/fixtures/primary-origin.html')
      cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')
    })
  })

  it('supports navigating by changing the AUT\'s location', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.document().invoke('location.assign', 'http://www.foobar.com:3500/fixtures/dom.html')

    cy.location('pathname').should('equal', '/fixtures/dom.html')
  })
})
