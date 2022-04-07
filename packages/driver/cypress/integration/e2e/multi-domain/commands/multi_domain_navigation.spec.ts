context('cy.origin navigation', () => {
  it('.go()', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

      cy.go('back')
      cy.location('pathname').should('include', 'multi-domain-secondary.html')

      cy.go('forward')
      cy.location('pathname').should('include', 'dom.html')
    })
  })

  it('.reload()', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').check().should('be.checked')
      cy.reload()
      cy.get(':checkbox[name="colors"][value="blue"]').should('not.be.checked')
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

      cy.visit('/fixtures/multi-domain.html', {
        onBeforeLoad: primaryVisitBeforeLoadSpy,
        onLoad: primaryVisitLoadSpy,
      }).then(() => {
        expect(primaryCyBeforeLoadSpy).to.be.calledOnce
        expect(primaryCyLoadSpy).to.be.calledTwice // twice because it's also called for 'about:blank'
        expect(primaryVisitBeforeLoadSpy).to.be.calledOnce
        expect(primaryVisitLoadSpy).to.be.calledOnce
      })

      cy.origin('http://foobar.com:3500', () => {
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
      cy.visit('/fixtures/multi-domain.html')

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('supports skipping visiting primary first', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    // TODO: we don't support nested cy.origin yet...
    it.skip('supports nesting a third origin', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

        cy.origin('http://idp.com:3500', () => {
          cy.visit('http://www.idp.com:3500/fixtures/dom.html')
        })
      })
    })

    it('supports navigating to secondary through button and then visiting', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')

        cy.visit('http://www.foobar.com:3500/fixtures/dom.html')
      })
    })

    it('supports relative urls within secondary', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/fixtures/dom.html')
        cy.location('href').should('equal', 'http://www.foobar.com:3500/fixtures/dom.html')
      })
    })

    it('supports hash change within secondary', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html#hashchange')

        cy.location('hash').should('equal', '#hashchange')
      })
    })

    it('navigates back to primary', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })

      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="cross-origin-secondary-link"]').should('have.text', 'http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
      cy.location('href').should('equal', 'http://localhost:3500/fixtures/multi-domain.html')
    })

    it('errors when visiting a new origin within origin', (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.include('failed trying to load:\n\nhttp://www.idp.com:3500/fixtures/dom.html')
        expect(e.message).to.include('failed because you are attempting to visit a URL that is of a different origin')
        expect(e.message).to.include('You may only `cy.visit()` same-origin URLs within `cy.origin()`.')
        expect(e.message).to.include('The previous URL you visited was:\n\n  > \'http://www.foobar.com:3500\'')
        expect(e.message).to.include('You\'re attempting to visit this URL:\n\n  > \'http://www.idp.com:3500\'')

        done()
      })

      cy.visit('/fixtures/multi-domain.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()

      cy.origin('http://foobar.com:3500', () => {
        // this call should error since we can't visit a cross-origin
        cy.visit('http://www.idp.com:3500/fixtures/dom.html')
      })
    })

    it('supports the query string option', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html', { qs: { foo: 'bar' } })

        cy.location('search').should('equal', '?foo=bar')
      })
    })

    it('can send a POST request', () => {
      cy.origin('http://foobar.com:3500', () => {
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
    })

    it('succeeds when the AUT window in the secondary is undefined', () => {
      // manually remove the spec bridge iframe to ensure Cypress.state('window') is not already set
      window.top?.document.getElementById('Spec\ Bridge:\ foobar.com')?.remove()

      cy.visit('/fixtures/multi-domain.html')

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('succeeds when the secondary is already defined but the AUT is still on the primary', () => {
      // setup the secondary to be on the secondary origin
      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })

      // update the AUT to be on the primary origin
      cy.visit('/fixtures/multi-domain.html')

      // verify there aren't any issues when the AUT is on primary but the spec bridge is on secondary (cross-origin)
      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('does not navigate to about:blank in secondary', () => {
      const primaryCyLoadSpy = cy.spy()

      cy.on('window:load', primaryCyLoadSpy)

      cy.origin('http://foobar.com:3500', () => {
        const secondaryCyLoadSpy = cy.spy()

        cy.on('window:load', secondaryCyLoadSpy)

        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html').then(() => {
          expect(secondaryCyLoadSpy).to.have.been.calledOnce
          expect(secondaryCyLoadSpy.args[0][0].location.href).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        })
      })

      cy.then(() => {
        expect(primaryCyLoadSpy).to.not.have.been.called
      })
    })

    it('supports visit redirects', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://localhost:3500/redirect?href=http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('supports auth options and adding auth to subsequent requests', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/basic_auth', {
          auth: {
            username: 'cypress',
            password: 'password123',
          },
        })

        cy.get('body').should('have.text', 'basic auth worked')

        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/basic_auth'
        })

        cy.get('body').should('have.text', 'basic auth worked')
      })

      // attaches the auth options for the foobar origin even from another origin
      cy.origin('http://www.idp.com:3500', () => {
        cy.visit('/fixtures/multi-domain.html')

        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/basic_auth'
        })
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.get('body').should('have.text', 'basic auth worked')
      })

      cy.visit('/fixtures/multi-domain.html')

      // attaches the auth options for the foobar origin from the top-level
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/basic_auth'
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.get('body').should('have.text', 'basic auth worked')
      })
    })

    it('does not propagate the auth options across tests', (done) => {
      cy.intercept('/basic_auth', (req) => {
        req.on('response', (res) => {
          // clear the www-authenticate header so the browser doesn't prompt for username/password
          res.headers['www-authenticate'] = ''
          expect(res.statusCode).to.equal(401)
          done()
        })
      })

      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/multi-domain.html'
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/basic_auth'
        })
      })
    })

    it('succeeds when visiting local file server first', { baseUrl: undefined }, () => {
      cy.visit('cypress/fixtures/multi-domain.html')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/fixtures/multi-domain-secondary.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
      })
    })

    it('handles visit failures', { baseUrl: undefined }, (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.include('failed trying to load:\n\nhttp://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        expect(e.message).to.include('500: Internal Server Error')

        done()
      })

      cy.intercept('*/multi-domain-secondary.html', { statusCode: 500 })

      cy.visit('cypress/fixtures/multi-domain.html')
      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('fixtures/multi-domain-secondary.html')
      })
    })
  })

  it('supports navigating through changing the window.location.href', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/dom.html'
      })

      cy.location('pathname').should('equal', '/fixtures/dom.html')
    })
  })
})
