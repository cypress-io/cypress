const { _ } = Cypress

describe('src/cy/commands/assertions', () => {
  beforeEach(function () {
    cy.visit('/fixtures/jquery.html')
  })

  context('chai overrides', () => {
    beforeEach(function () {
      this.$body = cy.$$('body')
    })

    describe('#contain', () => {
      it('can find input type submit by value', function () {
        // $input creates an HTML element to be tested.
        // eslint-disable-next-line no-unused-vars
        const $input = cy.$$('<input type=\'submit\' value=\'click me\' />').appendTo(this.$body)

        cy.get('input[type=submit]').should('contain', 'click me')
      })

      it('is true when element contains text', () => {
        cy.get('div').should('contain', 'Nested Find')
      })

      it('calls super when not DOM element', () => {
        cy.noop('foobar').should('contain', 'oob')
      })

      // https://github.com/cypress-io/cypress/issues/205
      it('fails existence check on not.contain for non-existent DOM', function (done) {
        cy.timeout(100)
        cy.on('fail', ({ message }) => {
          expect(message)
          .include('.non-existent')
          .include('but never found it')

          done()
        })

        cy.get('.non-existent').should('not.contain', 'foo')
      })

      // https://github.com/cypress-io/cypress/issues/3549
      it('is true when DOM el and not jQuery el contains text', () => {
        cy.get('div').then(($el) => {
          cy.wrap($el[1]).should('contain', 'Nested Find')
        })
      })

      it('escapes quotes', () => {
        const $span = '<span id="escape-quotes">shouldn\'t and can"t</span>'

        cy.$$($span).appendTo(cy.$$('body'))

        cy.get('#escape-quotes').should('contain', 'shouldn\'t')
      })

      // https://github.com/cypress-io/cypress/issues/19116
      it('escapes backslashes', () => {
        const $span = '<span id="escape-backslashes">"&lt;OE_D]dQ\\</span>'

        cy.$$($span).appendTo(cy.$$('body'))

        cy.get('#escape-backslashes').should('contain', '"<OE_D]dQ\\')
      })
    })

    describe('#match', () => {
      it('calls super when provided a regex', () => {
        expect('foo').to.match(/foo/)
      })

      it('throws when not provided a regex', () => {
        const fn = () => {
          expect('foo').to.match('foo')
        }

        expect(fn).to.throw('`match` requires its argument be a `RegExp`. You passed: `foo`')
      })

      it('throws with cy.should', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`match` requires its argument be a `RegExp`. You passed: `bar`')

          done()
        })

        cy.noop('foo').should('match', 'bar')
      })

      it('does not affect DOM element matching', () => {
        cy.get('body').should('match', 'body')
      })
    })

    describe('#exist', () => {
      it('uses $el.selector in expectation', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **#does-not-exist** not to exist in the DOM')

            done()
          }
        })

        cy.get('#does-not-exist').should('not.exist')
      })

      // https://github.com/cypress-io/cypress/issues/25491
      it('allows chaining another assertion after exist on a raw DOM element', () => {
        cy.document().then((doc) => {
          cy.wrap(doc.body).should('exist').and('exist')
        })
      })

      // https://github.com/cypress-io/cypress/issues/25491
      it('allows chaining after the exists alias on a raw DOM element', () => {
        cy.document().then((doc) => {
          cy.wrap(doc.body).should('exists').and('exists')
        })
      })

      // chai's `exists` alias is a separate property from `exist`, so verify it
      // gets Cypress's DOM-aware existence behavior and not chai's nullish check
      // (an empty jQuery object is non-null, so vanilla chai would pass `exists`).
      it('uses DOM existence behavior for the exists alias', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **#does-not-exist** not to exist in the DOM')

            done()
          }
        })

        cy.get('#does-not-exist').should('not.exists')
      })

      it('fails the exists alias for a detached jQuery subject', () => {
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('exists')
        cy.wrap(cy.$$('.non-existent')).should('not.exists')
      })
    })

    describe('#be.visible', () => {
      it('sets type to child', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('type')).to.eq('child')

            done()
          }
        })

        cy
        .get('body')
        .get('button').should('be.visible')
      })

      it('jquery wrapping els and selectors, not changing subject', () => {
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('not.be.visible')
        cy.wrap(cy.$$('<div></div>')).should('not.exist')
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('exist')
        cy.wrap(cy.$$('.non-existent')).should('not.exist')
      })

      // https://github.com/cypress-io/cypress/issues/205
      describe('does not pass not.visible for non-dom', { defaultCommandTimeout: 50 }, function () {
        it('undefined', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap().should('not.be.visible')
        })

        it('null', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap(null).should('not.be.visible')
        })

        it('[]', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap([]).should('not.be.visible')
        })

        it('{}', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap({}).should('not.be.visible')
        })

        it('fails not.visible for detached DOM', function (done) {
          cy.on('fail', (err) => {
            expect(err.message).include('`cy.should()` failed because the page updated')
            done()
          })

          cy.get('<div></div>').should('not.be.visible')
        })

        it('fails not.visible for non-existent DOM', function (done) {
          cy.on('fail', (err) => {
            // prints selector on failure
            // https://github.com/cypress-io/cypress/issues/5763
            expect(err.message).include('.non-existent')
            expect(err.message).include('Expected to find')
            done()
          })

          cy.get('.non-existent', { timeout: 10 }).should('not.visible')
        })
      })
    })

    describe('#have.length', () => {
      it('formats _obj with cypress', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **<button>** to have a length of **1**')

            done()
          }
        })

        cy.get('button:first').should('have.length', 1)
      })

      it('formats error _obj with cypress', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('_error').message).to.eq('expected \'<body>\' to have a length of 2 but got 1')

            done()
          }
        })

        cy.get('body').should('have.length', 2)
      })

      it('formats _obj with cypress for `not.have.length`', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **<button>** to not have a length of **2**')

            done()
          }
        })

        cy.get('button:first').should('not.have.length', 2)
      })

      it('formats error _obj with cypress for `not.have.length`', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('_error').message).to.eq('expected \'<body>\' to not have a length of 1')

            done()
          }
        })

        cy.get('body').should('not.have.length', 1)
      })

      it('does not touch non DOM objects', () => {
        cy.noop([1, 2, 3]).should('have.length', 3)
      })

      it('rejects any element not in the document', function () {
        cy.$$('<button />').appendTo(this.$body)
        cy.$$('<button />').appendTo(this.$body)

        const buttons = cy.$$('button')

        const { length } = buttons

        cy.on('command:retry', _.after(2, () => {
          cy.$$('button:last').remove()
        }))

        cy.wrap(buttons).should('have.length', length - 1)
      })

      // https://github.com/cypress-io/cypress/issues/14484
      it('does not override user-defined error message', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Filter should have 1 items')

          done()
        })

        cy.get('div', { timeout: 100 }).should(($divs) => {
          expect($divs, 'Filter should have 1 items').to.have.length(1)
        })
      })
    })
  })
})
