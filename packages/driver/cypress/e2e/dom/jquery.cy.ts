describe('src/dom/jquery', () => {
  context('.isJquery', () => {
    it('does not get confused when window contains jquery function', () => {
      // @ts-expect-error - Intentionally adding jquery property to test conflict detection
      window.jquery = () => {}

      expect(Cypress.dom.isJquery(window)).to.be.false
    })

    it('is true for actual jquery instances', () => {
      expect(Cypress.dom.isJquery(Cypress.$(':first'))).to.be.true
    })

    // https://github.com/cypress-io/cypress/issues/14278
    it('does not return undefined', () => {
      cy.visit('fixtures/dom.html')

      cy.get('#dom').then(($el) => {
        expect(Cypress.dom.isJquery($el[0])).to.eql(false)
        // @ts-expect-error
        expect(Cypress.dom.isJquery()).to.eql(false)
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/14279
  it('empty jQuery object is shown properly in "DOM required" error message', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('jQuery{0}')

      done()
    })

    cy.visit('fixtures/dom.html')
    cy.noop(cy.$$('#should-not-exist')).scrollTo('250px', '250px')
  })

  // https://github.com/cypress-io/cypress/issues/1502
  context('jQuery conflicts', () => {
    it('handles window.$ overridden with non-function value (dynamic)', () => {
      cy.visit('fixtures/dom.html')

      // Override window.$ with a string value after page load
      cy.window().then((win) => {
        // @ts-expect-error - Intentionally overriding jQuery with non-function to test conflict handling
        win.$ = 'foo'
      })

      // This should not throw "remoteJQuery is not a function" error
      cy.get('#dom').then(() => {
        // Test should pass without errors
      })
    })

    it('handles window.$ overridden with object value (dynamic)', () => {
      cy.visit('fixtures/dom.html')

      // Override window.$ with an object value after page load
      cy.window().then((win) => {
        // @ts-expect-error - Intentionally overriding jQuery with non-function to test conflict handling
        win.$ = { notAFunction: true }
      })

      // This should not throw "remoteJQuery is not a function" error
      cy.get('#dom').then(() => {
        // Test should pass without errors
      })
    })

    it('handles window.$ overridden with non-function value (static)', () => {
      // Test with window.$ pre-set in HTML
      cy.visit('fixtures/jquery-conflict-test.html')

      // This should not throw "remoteJQuery is not a function" error
      cy.get('h1').then(() => {
        // Test should pass without errors
      })
    })

    it('reproduces the exact user issue: window.$ = "foo" with h1 element', () => {
      cy.visit('fixtures/jquery-conflict-test.html')

      // The HTML already has window.$ = 'foo' set
      // This should not throw "remoteJQuery is not a function" error
      cy.get('h1').then(() => {
        // Test should pass without errors - this was failing before the fix
      })
    })

    it('assertions work correctly when window.$ is overridden', () => {
      cy.visit('fixtures/jquery-conflict-test.html')

      // Test that assertions work properly
      cy.get('h1')
      .should('contain', 'Hello world')
      .should('be.visible')
      .should('have.text', 'Hello world')
      .then(($el) => {
        expect($el).to.exist
        expect($el.text()).to.equal('Hello world')
      })
    })

    it('should commands work with jQuery conflicts', () => {
      cy.visit('fixtures/jquery-conflict-test.html')

      // Test should() with function callback
      cy.get('h1').should(($el) => {
        expect($el).to.exist
        expect($el.text()).to.equal('Hello world')
      })
    })
  })
})
