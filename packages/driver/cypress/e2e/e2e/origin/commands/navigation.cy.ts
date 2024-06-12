import { authCreds } from '../../../../fixtures/auth_creds'
import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin navigation', { browser: '!webkit' }, () => {
  it('.go()', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

      cy.go('back')
      cy.location('pathname').should('include', 'secondary-origin.html')

      cy.go('forward')
      cy.location('pathname').should('include', 'dom.html')
    })
  })

  it('.reload()', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().then((localWindow) => {
        // Define a custom property on window that we can assert the presence of.
        // After reloading, this property should not exist.
        // @ts-ignore
        localWindow.cy_testCustomValue = true
      })

      cy.window().should('have.prop', 'cy_testCustomValue', true)

      cy.reload()

      cy.window().should('not.have.prop', 'cy_testCustomValue', true)
    })
  })

  context('.visit()', () => {
    it('calls the correct load handlers', () => {
      const primaryCyBeforeLoadSpy = cy.spy()
      const primaryCyLoadSpy = cy.spy()
      const primaryVisitBeforeLoadSpy = cy.spy()
      const primaryVisitLoadSpy = cy.spy()

      cy.on('window:before:load', primaryCyBeforeLoadSpy)
      cy.on('window:load', primaryCyLoadSpy)

      cy.visit('/fixtures/primary-origin.html', {
        onBeforeLoad: primaryVisitBeforeLoadSpy,
        onLoad: primaryVisitLoadSpy,
      }).then(() => {
        expect(primaryCyBeforeLoadSpy).to.be.calledOnce
        expect(primaryCyLoadSpy).to.be.calledOnce
        expect(primaryVisitBeforeLoadSpy).to.be.calledOnce
        expect(primaryVisitLoadSpy).to.be.calledOnce
      })

      cy.origin('http://www.foobar.com:3500', () => {
        const secondaryCyBeforeLoadSpy = cy.spy()
        const secondaryCyLoadSpy = cy.spy()
        const secondaryVisitBeforeLoadSpy = cy.spy()
        const secondaryVisitLoadSpy = cy.spy()

        cy.on('window:before:load', secondaryCyBeforeLoadSpy)
        cy.on('window:load', secondaryCyLoadSpy)

        cy.visit('http://www.foobar.com:3500/fixtures/dom.html', {
          onBeforeLoad: secondaryVisitBeforeLoadSpy,
          onLoad: secondaryVisitLoadSpy,
        }).then(() => {
          expect(secondaryCyBeforeLoadSpy).to.be.calledOnce
          expect(secondaryCyLoadSpy).to.be.calledOnce
          expect(secondaryVisitBeforeLoadSpy).to.be.calledOnce
          expect(secondaryVisitLoadSpy).to.be.calledOnce
        })
      }).then(() => {
        expect(primaryCyBeforeLoadSpy).to.be.calledOnce
        expect(primaryCyLoadSpy).to.be.calledTwice
        expect(primaryVisitBeforeLoadSpy).to.be.calledOnce
        expect(primaryVisitLoadSpy).to.be.calledOnce
      })
    })

    it('supports visiting primary first', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('supports skipping visiting primary first', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    // TODO: we don't support nested cy.origin yet...
    it.skip('supports nesting a third origin', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

        cy.origin('http://www.idp.com:3500', () => {
          cy.visit('http://www.idp.com:3500/fixtures/dom.html')
        })
      })
    })

    it('supports navigating to secondary through button and then visiting', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

        cy.visit('http://www.foobar.com:3500/fixtures/dom.html')
        cy.location('href').should('equal', 'http://www.foobar.com:3500/fixtures/dom.html')
      })
    })

    it('supports relative urls within secondary', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/fixtures/dom.html')
        cy.location('href').should('equal', 'http://www.foobar.com:3500/fixtures/dom.html')
      })
    })

    it('supports relative urls with path within secondary', () => {
      cy.origin('http://www.foobar.com:3500/fixtures', () => {
        cy.visit('/dom.html')
        cy.location('href').should('equal', 'http://www.foobar.com:3500/fixtures/dom.html')
      })
    })

    it('supports relative urls with hash within secondary', () => {
      cy.origin('http://www.foobar.com:3500/#hash', () => {
        cy.visit('/more-hash')
        cy.location('href').should('equal', 'http://www.foobar.com:3500/#hash/more-hash')
      })
    })

    it('supports relative urls with path and hash within secondary', () => {
      cy.origin('http://www.foobar.com:3500/welcome/#hash', () => {
        cy.visit('/more-hash')
        cy.location('href').should('equal', 'http://www.foobar.com:3500/welcome/#hash/more-hash')
      })
    })

    it('supports hash change within secondary', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html#hashchange')

        cy.location('hash').should('equal', '#hashchange')
      })
    })

    it('navigates back to primary', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })

      cy.visit('/fixtures/primary-origin.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').should('have.text', 'http://www.foobar.com:3500/fixtures/secondary-origin.html')
      cy.location('href').should('equal', 'http://localhost:3500/fixtures/primary-origin.html')
    })

    it('succeeds when visiting a new origin within origin', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        // this call should succeed because we can visit a cross-origin
        cy.visit('http://www.idp.com:3500/fixtures/dom.html')
      })

      cy.origin('http://www.idp.com:3500', () => {
        cy.location('pathname').should('equal', '/fixtures/dom.html')
      })
    })

    it('supports the query string option', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html', { qs: { foo: 'bar' } })

        cy.location('search').should('equal', '?foo=bar')
      })
    })

    it('can send a POST request', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/post-only', {
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
    })

    it('succeeds when the AUT window in the secondary is undefined', () => {
      // manually remove the spec bridge iframe to ensure Cypress.state('window') is not already set
      window.top?.document.getElementById('Spec\ Bridge:\ foobar.com')?.remove()

      cy.visit('/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('succeeds when the secondary is already defined but the AUT is still on the primary', () => {
      // setup the secondary to be on the secondary origin
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })

      // update the AUT to be on the primary origin
      cy.visit('/fixtures/primary-origin.html')

      // verify there aren't any issues when the AUT is on primary but the spec bridge is on secondary (cross-origin)
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('does not navigate to about:blank in secondary', () => {
      const primaryCyLoadSpy = cy.spy()

      cy.on('window:load', primaryCyLoadSpy)

      cy.origin('http://www.foobar.com:3500', () => {
        const secondaryCyLoadSpy = cy.spy()

        cy.on('window:load', secondaryCyLoadSpy)

        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html').then(() => {
          expect(secondaryCyLoadSpy).to.have.been.calledOnce
          expect(secondaryCyLoadSpy.args[0][0].location.href).to.equal('http://www.foobar.com:3500/fixtures/secondary-origin.html')
        })
      })

      cy.then(() => {
        expect(primaryCyLoadSpy).to.have.been.called
      })
    })

    it('supports redirecting from primary to secondary in cy.origin', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://localhost:3500/redirect?href=http://www.foobar.com:3500/fixtures/secondary-origin.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('supports redirecting from secondary to primary outside of cy.origin', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.visit('http://www.foobar.com:3500/redirect?href=http://localhost:3500/fixtures/generic.html')
    })

    it('succeeds when trying to redirect from secondary to primary in cy.origin', () => {
      cy.visit('http://localhost:3500/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/redirect?href=http://localhost:3500/fixtures/generic.html')
      })
    })

    it('succeeds when trying to visit primary in cy.origin', () => {
      cy.visit('http://localhost:3500/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')
      })
    })

    it('succeeds when trying to redirect from primary to secondary outside of cy.origin', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.visit('http://localhost:3500/redirect?href=http://www.foobar.com:3500/fixtures/generic.html')
    })

    it('supports auth options and adding auth to subsequent requests', () => {
      cy.origin('http://www.foobar.com:3500', { args: authCreds }, (auth) => {
        cy.visit('http://www.foobar.com:3500/basic_auth', { auth })

        cy.get('body').should('have.text', 'basic auth worked')

        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/basic_auth'
        })

        cy.get('body').should('have.text', 'basic auth worked')
      })

      // attaches the auth options for the foobar origin even from another origin
      cy.origin('http://www.idp.com:3500', () => {
        cy.visit('/fixtures/primary-origin.html')

        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/basic_auth'
        })
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('body').should('have.text', 'basic auth worked')
      })

      cy.visit('/fixtures/primary-origin.html')

      // attaches the auth options for the foobar origin from the top-level
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/basic_auth'
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('body').should('have.text', 'basic auth worked')
      })
    })

    // FIXME: flaky
    it.skip('does not propagate the auth options across tests', (done) => {
      cy.intercept('/basic_auth', (req) => {
        req.on('response', (res) => {
          // clear the www-authenticate header so the browser doesn't prompt for username/password
          res.headers['www-authenticate'] = ''
          expect(res.statusCode).to.equal(401)
          done()
        })
      })

      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/primary-origin.html'
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/basic_auth'
        })
      })
    })

    it('succeeds when visiting local file server first', { baseUrl: undefined }, () => {
      cy.visit('cypress/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/fixtures/secondary-origin.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('handles visit failures', { baseUrl: undefined }, (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.include('failed trying to load:\n\nhttp://www.foobar.com:3500/fixtures/secondary-origin.html')
        expect(e.message).to.include('500: Internal Server Error')

        done()
      })

      cy.intercept('*/secondary-origin.html', { statusCode: 500 })

      cy.visit('cypress/fixtures/primary-origin.html')
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('fixtures/secondary-origin.html')
      })
    })
  })

  it('supports navigating through changing the window.location.href', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/dom.html'
      })

      cy.location('pathname').should('equal', '/fixtures/dom.html')
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

    // TODO: Investigate this flaky test.
    it.skip('.go()', { retries: 15 }, () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

        cy.go('back')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, ...attrs } = findCrossOriginLogs('go', logs, 'foobar.com')

        expect(attrs.name).to.equal('go')
        expect(attrs.message).to.equal('back')

        expect(consoleProps.name).to.equal('go')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })

    it('.reload()', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="dom-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.reload()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, ...attrs } = findCrossOriginLogs('reload', logs, 'foobar.com')

        expect(attrs.name).to.equal('reload')
        expect(attrs.message).to.equal('')

        expect(consoleProps.name).to.equal('reload')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })

    it('visit()', () => {
      cy.visit('/fixtures/primary-origin.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, ...attrs } = findCrossOriginLogs('visit', logs, 'foobar.com')

        expect(attrs.name).to.equal('visit')
        expect(attrs.message).to.equal('http://www.foobar.com:3500/fixtures/secondary-origin.html')

        expect(consoleProps.name).to.equal('visit')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props).to.have.property('Cookies Set').that.is.an('object')
        expect(consoleProps.props).to.have.property('Redirects').that.is.an('object')
        expect(consoleProps.props).to.have.property('Resolved Url').that.equals('http://www.foobar.com:3500/fixtures/secondary-origin.html')
      })
    })
  })
})
