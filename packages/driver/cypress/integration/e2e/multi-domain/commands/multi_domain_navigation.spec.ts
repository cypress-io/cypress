// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain navigation', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  it('.go()', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()

    cy.switchToDomain('foobar.com', () => {
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

    cy.switchToDomain('foobar.com', () => {
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

      cy.switchToDomain('foobar.com', () => {
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

      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
      })
    })

    it('supports skipping visiting primary first', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
      })
    })

    // TODO: we don't support nested domains yet...
    it.skip('supports nesting a third domain', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')

        cy.switchToDomain('idp.com', () => {
          cy.visit('http://www.idp.com:3500/fixtures/dom.html')
        })
      })
    })

    it('supports navigating to secondary through button and then visiting', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="multi-domain-secondary-link"]').click()

      cy.switchToDomain('foobar.com', () => {
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')

        cy.visit('http://www.foobar.com:3500/fixtures/dom.html')
      })
    })

    // TODO: add support for relative links within secondary
    it.skip('supports relative urls within secondary', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="multi-domain-secondary-link"]').click()

      cy.switchToDomain('foobar.com', () => {
        cy.visit('/fixtures/dom.html')
      })
    })

    it('supports hash change within secondary', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="multi-domain-secondary-link"]').click()

      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html#hashchange')

        cy.location('hash').should('equal', '#hashchange')
      })
    })

    it('navigates back to primary', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
      })

      cy.visit('/fixtures/multi-domain.html')

      cy.get('a[data-cy="multi-domain-secondary-link"]').should('have.text', 'http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
      cy.location('href').should('equal', 'http://localhost:3500/fixtures/multi-domain.html')
    })

    it('errors when visiting a new domain within switchToDomain', (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.include('failed trying to load:\n\nhttp://www.idp.com:3500/fixtures/dom.html')
        expect(e.message).to.include('failed because you are attempting to visit a URL that is of a different origin')

        done()
      })

      cy.visit('/fixtures/multi-domain.html')
      cy.get('a[data-cy="multi-domain-secondary-link"]').click()

      cy.switchToDomain('foobar.com', () => {
        // this call should error since we can't visit a cross-domain
        cy.visit('http://www.idp.com:3500/fixtures/dom.html')
      })
    })

    it('supports the query string option', () => {
      cy.visit('/fixtures/multi-domain.html')

      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html', { qs: { foo: 'bar' } })

        cy.location('search').should('equal', '?foo=bar')
      })
    })

    it('can send a POST request', () => {
      cy.switchToDomain('foobar.com', () => {
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

      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
      })
    })

    it('succeeds when the secondary is already defined but the AUT is still on the primary', () => {
      // setup the secondary to be on the secondary domain
      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
      })

      // update the AUT to be on the primary domain
      cy.visit('/fixtures/multi-domain.html')

      // verify there aren't any issues when the AUT is on primary but the spec bridge is on secondary (cross-origin)
      cy.switchToDomain('foobar.com', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
      })
    })
  })

  it('supports navigating through changing the window.location.href', () => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/dom.html'
      })

      cy.location('pathname').should('equal', '/fixtures/dom.html')
    })
  })
})
