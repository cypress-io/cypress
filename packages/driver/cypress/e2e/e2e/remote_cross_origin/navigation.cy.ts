const SECONDARY_ORIGIN_PAGE = 'http://www.foobar.com:3500/fixtures/secondary-origin.html'

describe('remote driver: navigation in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  describe('navigation events', () => {
    const logNames: string[] = []
    const urls: string[] = []

    beforeEach(() => {
      logNames.length = 0
      urls.length = 0

      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
      cy.location('href').should('equal', SECONDARY_ORIGIN_PAGE).then(() => {
        cy.on('log:added', (attrs) => logNames.push(attrs.name))
        cy.on('url:changed', (url) => urls.push(url))
      })
    })

    describe('url changes', () => {
      it('reports a hash change', () => {
        cy.get('a[data-cy="hashChange"]').click()
        cy.wrap(urls).should('include', `${SECONDARY_ORIGIN_PAGE}#hashChange`)
        cy.location('host').should('equal', 'www.foobar.com:3500')
        cy.location('pathname').should('equal', '/fixtures/secondary-origin.html')
        cy.hash().should('equal', '#hashChange')
      })

      it('navigates forward and back using history', () => {
        cy.get('a[data-cy="cross-origin-page"]').click()
        cy.location('pathname').should('equal', '/fixtures/primary-origin.html')

        cy.go('back')
        cy.location('pathname').should('equal', '/fixtures/secondary-origin.html')

        cy.go('forward')
        cy.location('pathname').should('equal', '/fixtures/primary-origin.html')
      })
    })

    describe('window:load', () => {
      it('reloads', () => {
        let loads = 0

        cy.on('window:load', () => {
          loads++
        })

        cy.get('button[data-cy="reload"]').click()
        cy.wrap(null).should(() => {
          expect(loads).to.equal(1)
          expect(logNames).to.include('page load')
        })

        cy.location('href').should('equal', SECONDARY_ORIGIN_PAGE)
      })

      it('navigates to a new page', () => {
        let loads = 0

        cy.on('window:load', () => {
          loads++
        })

        cy.get('a[data-cy="cross-origin-page"]').click()
        cy.get('a[data-cy="cross-origin-secondary-link').invoke('text').should('equal', SECONDARY_ORIGIN_PAGE)
        cy.wrap(null).should(() => {
          expect(loads).to.equal(1)
          expect(logNames).to.include('page load')
        })

        cy.location('host').should('equal', 'www.foobar.com:3500')
        cy.location('pathname').should('equal', '/fixtures/primary-origin.html')
      })
    })

    describe('url:changed', () => {
      it('navigates to a new page', () => {
        cy.get('a[data-cy="cross-origin-page"]').click()
        cy.wrap(urls).should('include', 'http://www.foobar.com:3500/fixtures/primary-origin.html')
      })
    })
  })

  describe('event timing', () => {
    it('follows a navigation the app starts from one cross-origin page to another', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
      cy.get('a[data-cy="cross-origin-tertiary-link"]').click()

      cy.location('host').should('equal', 'www.idp.com:3500')
      cy.location('pathname').should('equal', '/fixtures/generic.html')
    })
  })

  describe('delayed navigation', { defaultCommandTimeout: 4000 }, () => {
    it('localhost -> localhost', () => {
      cy.visit('/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-localhost"]').click()
      cy.get('[data-cy="login-idp"]')
    })

    it('localhost -> foobar, delay in', () => {
      cy.visit('/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-foobar"]').click()
      cy.get('[data-cy="login-idp"]')
      cy.location('host').should('equal', 'www.foobar.com:3500')
    })

    it('foobar -> localhost, delay out', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.visit('http://www.foobar.com:3500/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-localhost"]').click()

      cy.get('[data-cy="login-idp"]')
      cy.location('host').should('equal', 'localhost:3500')
    })

    it('foobar -> idp, delay out', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.visit('http://www.foobar.com:3500/fixtures/auth/delayedNavigate.html')
      cy.get('[data-cy="to-idp"]').click()

      cy.get('[data-cy="login-idp"]')
      cy.location('host').should('equal', 'www.idp.com:3500')
    })
  })

  describe('commands after the app navigates', () => {
    it('runs commands against the origin the app navigated to', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-foobar"]').click()
      cy.get('[data-cy="username"]').should('exist')
      cy.location('host').should('equal', 'www.foobar.com:3500')
    })

    it('logs in through a login page on another origin', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-foobar"]').click()
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    it('fails with a normal timeout', { defaultCommandTimeout: 500 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Timed out retrying after 500ms:')
        expect(err.message).to.include('Expected to find element: `[data-cy="cannot_find"]`, but never found it.')
        expect(err.message).not.to.include('The following error originated from your test code, not from Cypress')
        expect(err.message).not.to.include('The following error originated from your application code, not from Cypress')
        expect(err.message).not.to.include('The command was expected to run against origin')
        done()
      })

      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.get('[data-cy="username"]')
      cy.get('[data-cy="cannot_find"]')
    })
  })
})
