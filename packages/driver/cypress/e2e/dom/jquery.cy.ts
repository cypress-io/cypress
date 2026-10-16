/// <reference path="./jquery.d.ts" />

describe('src/dom/jquery', () => {
  context('.isJquery', () => {
    it('does not get confused when window contains jquery function', () => {
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

describe('jQuery API behavior', () => {
  beforeEach(() => {
    cy.visit('fixtures/dom.html')
  })

  // `Cypress.$(el)` dimension methods report the CSS box model: `.width()` is
  // the content box, `.inner*` adds padding, `.outer*` adds border, and
  // `.outer*(true)` adds margin.
  context('box-model dimensions', () => {
    const appendBox = (doc: Document, boxSizing: string) => {
      return Cypress.$('<div></div>')
      .css({
        position: 'absolute',
        display: 'block',
        boxSizing,
        width: '100px',
        height: '50px',
        padding: '10px',
        borderWidth: '2px',
        borderStyle: 'solid',
        margin: '5px',
      })
      .appendTo(doc.body)
    }

    it('reports content-box width/height across the box model', () => {
      cy.document().then((doc) => {
        const $el = appendBox(doc, 'content-box')

        expect($el.width(), 'width').to.eq(100)
        expect($el.height(), 'height').to.eq(50)
        expect($el.innerWidth(), 'innerWidth').to.eq(120)
        expect($el.innerHeight(), 'innerHeight').to.eq(70)
        expect($el.outerWidth(), 'outerWidth').to.eq(124)
        expect($el.outerHeight(), 'outerHeight').to.eq(74)
        expect($el.outerWidth(true), 'outerWidth(true)').to.eq(134)
        expect($el.outerHeight(true), 'outerHeight(true)').to.eq(84)

        $el.remove()
      })
    })

    it('reports border-box width/height across the box model', () => {
      cy.document().then((doc) => {
        const $el = appendBox(doc, 'border-box')

        expect($el.width(), 'width').to.eq(76)
        expect($el.height(), 'height').to.eq(26)
        expect($el.innerWidth(), 'innerWidth').to.eq(96)
        expect($el.innerHeight(), 'innerHeight').to.eq(46)
        expect($el.outerWidth(), 'outerWidth').to.eq(100)
        expect($el.outerHeight(), 'outerHeight').to.eq(50)
        expect($el.outerWidth(true), 'outerWidth(true)').to.eq(110)
        expect($el.outerHeight(true), 'outerHeight(true)').to.eq(60)

        $el.remove()
      })
    })
  })

  // `.attr()` returns the attribute-name string for a present boolean
  // attribute and `undefined` when absent, while `.prop()` returns a boolean.
  // The chai-jquery `have.attr` layer depends on these `.attr()` return values.
  context('.attr() / .prop() boolean attributes', () => {
    it('returns the attribute name from .attr() and a boolean from .prop()', () => {
      expect(Cypress.$('<input disabled>').attr('disabled'), 'disabled present .attr').to.eq('disabled')
      expect(Cypress.$('<input>').attr('disabled'), 'disabled absent .attr').to.be.undefined
      expect(Cypress.$('<input disabled>').prop('disabled'), 'disabled present .prop').to.be.true
      expect(Cypress.$('<input>').prop('disabled'), 'disabled absent .prop').to.be.false

      expect(Cypress.$('<input type="checkbox" checked>').attr('checked'), 'checked present .attr').to.eq('checked')
      expect(Cypress.$('<input type="checkbox">').attr('checked'), 'checked absent .attr').to.be.undefined
      expect(Cypress.$('<input type="checkbox" checked>').prop('checked'), 'checked present .prop').to.be.true

      expect(Cypress.$('<input readonly>').attr('readonly'), 'readonly present .attr').to.eq('readonly')
    })
  })

  // Attribute selectors resolve with both quote styles and with values that
  // contain special characters such as an apostrophe (issue #8626).
  context('attribute selectors', () => {
    it('resolves [attr~="value"] with double and single quotes', () => {
      cy.document().then((doc) => {
        Cypress.$('<div data-cy-attr="alpha beta" id="attr-target">x</div>').appendTo(doc.body)
      })

      cy.get('[data-cy-attr~="beta"]').should('have.attr', 'id', 'attr-target')
      cy.get(`[data-cy-attr~='beta']`).should('have.attr', 'id', 'attr-target')
    })

    it('resolves attribute selectors whose value contains an apostrophe', () => {
      cy.document().then((doc) => {
        Cypress.$(`<div data-cy-attr="o'brien" id="apostrophe-target">y</div>`).appendTo(doc.body)
      })

      cy.get(`[data-cy-attr="o'brien"]`).should('have.attr', 'id', 'apostrophe-target')
    })
  })
})
