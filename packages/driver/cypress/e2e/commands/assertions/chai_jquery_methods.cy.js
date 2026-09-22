const { assertLogLength } = require('../../../support/utils')
const { $ } = Cypress

describe('src/cy/commands/assertions', () => {
  beforeEach(function () {
    cy.visit('/fixtures/jquery.html')
  })

  context('chai plugins', () => {
    beforeEach(function () {
      this.logs = []

      this.clearLogs = () => {
        this.logs = []
      }

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
      })

      return null
    })

    context('data', () => {
      beforeEach(function () {
        this.$div = $('<div data-foo=\'bar\' />')
        this.$div.data = function () {
          throw new Error('data called')
        }
      })

      it('no prop, with prop, negation, and chainable', function () {
        expect(this.$div).to.have.data('foo') // 1
        expect(this.$div).to.have.data('foo', 'bar') // 2,3
        expect(this.$div).to.have.data('foo').and.eq('bar') // 4,5
        expect(this.$div).to.have.data('foo').and.match(/bar/) // 6,7
        expect(this.$div).not.to.have.data('baz') // 8

        assertLogLength(this.logs, 8)
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#data-number').then(($el) => {
          expect($el).to.have.data('number', 222)
          expect($el).not.to.have.data('number', '222')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.be.ok
          expect(err.message).to.include('> data')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.data('foo')
      })
    })

    context('class', () => {
      beforeEach(function () {
        this.$div = $('<div class=\'foo bar\' />')
        this.$div.hasClass = function () {
          throw new Error('hasClass called')
        }
      })

      it('class, not class', function () {
        expect(this.$div).to.have.class('foo') // 1
        expect(this.$div).to.have.class('bar') // 2
        expect(this.$div).not.to.have.class('baz') // 3

        assertLogLength(this.logs, 3)

        const l1 = this.logs[0]
        const l3 = this.logs[2]

        expect(l1.get('message')).to.eq(
          'expected **<div.foo.bar>** to have class **foo**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div.foo.bar>** not to have class **baz**',
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('.999').then(($el) => {
          expect($el).to.have.class(999)
          expect($el).to.have.class('999')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected \'foo\' to have class \'bar\'',
          )

          expect(err.message).to.include('> class')
          expect(err.message).to.include('> foo')

          done()
        })

        expect('foo').to.have.class('bar')
      })
    })

    context('id', () => {
      beforeEach(function () {
        this.$div = $('<div id=\'foo\' />')
        this.$div.prop = function () {
          throw new Error('prop called')
        }

        this.$div.attr = function () {
          throw new Error('attr called')
        }

        this.$div2 = $('<div />')
        this.$div2.prop('id', 'foo')
        this.$div2.prop = function () {
          throw new Error('prop called')
        }

        this.$div2.attr = function () {
          throw new Error('attr called')
        }

        this.$div3 = $('<div />')
        this.$div3.attr('id', 'foo')
        this.$div3.prop = function () {
          throw new Error('prop called')
        }

        this.$div3.attr = function () {
          throw new Error('attr called')
        }
      })

      it('id, not id', function () {
        expect(this.$div).to.have.id('foo') // 1
        expect(this.$div).not.to.have.id('bar') // 2

        expect(this.$div2).to.have.id('foo') // 3

        expect(this.$div3).to.have.id('foo') // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div#foo>** to have id **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div#foo>** not to have id **bar**',
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#456').then(($el) => {
          expect($el).to.have.id(456)
          expect($el).to.have.id('456')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected [] to have id \'foo\'',
          )

          expect(err.message).to.include('> id')
          expect(err.message).to.include('> []')

          done()
        })

        expect([]).to.have.id('foo')
      })
    })

    context('html', () => {
      beforeEach(function () {
        this.$div = $('<div><button>button</button></div>')
        this.$div.html = function () {
          throw new Error('html called')
        }
      })

      it('html, not html, contain html', function () {
        expect(this.$div).to.have.html('<button>button</button>') // 1
        expect(this.$div).not.to.have.html('foo') // 2
        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have HTML **<button>button</button>**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to have HTML **foo**',
        )

        this.clearLogs()
        expect(this.$div).to.contain.html('<button>')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** to contain HTML **<button>**',
        )

        this.clearLogs()
        expect(this.$div).to.not.contain.html('foo') // 4
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** not to contain HTML **foo**',
        )

        this.clearLogs()
        try {
          expect(this.$div).to.have.html('<span>span</span>')
        } catch (error) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to have HTML **<span>span</span>**, but the HTML was **<button>button</button>**',
          )
        }

        this.clearLogs()
        try {
          expect(this.$div).to.contain.html('<span>span</span>')
        } catch (error1) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to contain HTML **<span>span</span>**, but the HTML was **<button>button</button>**',
          )
        }
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected null to have HTML \'foo\'',
          )

          expect(err.message).to.include('> html')
          expect(err.message).to.include('> null')

          done()
        })

        expect(null).to.have.html('foo')
      })

      it('partial match', function () {
        expect(this.$div).to.contain.html('button')
        expect(this.$div).to.include.html('button')
        expect(this.$div).to.not.contain.html('span')

        cy.get('button').should('contain.html', 'button')
      })
    })

    context('text', () => {
      beforeEach(function () {
        this.$div = $('<div>foo</div>')
        this.$div.text = function () {
          throw new Error('text called')
        }
      })

      it('text, not text, contain text', function () {
        expect(this.$div).to.have.text('foo') // 1
        expect(this.$div).not.to.have.text('bar') // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have text **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to have text **bar**',
        )

        this.clearLogs()
        expect(this.$div).to.contain.text('f')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** to contain text **f**',
        )

        this.clearLogs()
        expect(this.$div).to.not.contain.text('foob')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** not to contain text **foob**',
        )

        this.clearLogs()
        try {
          expect(this.$div).to.have.text('bar')
        } catch (error) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to have text **bar**, but the text was **foo**',
          )
        }

        this.clearLogs()
        try {
          expect(this.$div).to.contain.text('bar')
        } catch (error1) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to contain text **bar**, but the text was **foo**',
          )
        }
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#number').then(($el) => {
          expect($el).to.have.text(123)
        })
      })

      it('partial match', function () {
        expect(this.$div).to.have.text('foo')
        expect(this.$div).to.contain.text('o')
        expect(this.$div).to.include.text('o')
        cy.get('div').should('contain.text', 'iv').should('contain.text', 'd')

        cy.get('div').should('not.contain.text', 'fizzbuzz').should('contain.text', 'Nest')
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected undefined to have text \'foo\'',
          )

          expect(err.message).to.include('> text')
          expect(err.message).to.include('> undefined')

          done()
        })

        expect(undefined).to.have.text('foo')
      })
    })

    context('value', () => {
      beforeEach(function () {
        this.$input = $('<input value=\'foo\' />')
        this.$input.val = function () {
          throw new Error('val called')
        }
      })

      it('value, not value, contain value', function () {
        expect(this.$input).to.have.value('foo') // 1
        expect(this.$input).not.to.have.value('bar') // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to have value **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to have value **bar**',
        )

        this.clearLogs()
        expect(this.$input).to.contain.value('foo')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<input>** to contain value **foo**',
        )

        this.clearLogs()
        expect(this.$input).not.to.contain.value('bar')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<input>** not to contain value **bar**',
        )

        this.clearLogs()
        try {
          expect(this.$input).to.have.value('bar')
        } catch (error) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<input>** to have value **bar**, but the value was **foo**',
          )
        }

        this.clearLogs()
        try {
          expect(this.$input).to.contain.value('bar')
        } catch (error1) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<input>** to contain value **bar**, but the value was **foo**',
          )
        }
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#value-number').then(($el) => {
          expect($el).to.have.value(123)
          expect($el).to.have.value('123')
        })
      })

      // https://github.com/cypress-io/cypress/issues/7603
      describe('when the type of value attr must be number', () => {
        it('<progress>', () => {
          cy.$$('<progress id="progress" value="0.72">72%</progress>').appendTo(cy.$$('body'))
          cy.get('#progress').should('have.value', 0.72)
          cy.get('#progress').should('not.have.value', '0.72')
        })

        it('<meter>', () => {
          cy.$$('<meter id="meter" min="0" max="100" low="33" high="66" optimum="80" value="50">at 50/100</meter>').appendTo(cy.$$('body'))
          cy.get('#meter').should('have.value', 50)
          cy.get('#meter').should('not.have.value', '50')
        })

        it('<li>', () => {
          cy.$$('<li id="li" value="3">Cypress</li>').appendTo(cy.$$('body'))
          cy.get('#li').should('have.value', 3)
          cy.get('#li').should('not.have.value', '3')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have value \'foo\'',
          )

          expect(err.message).to.include('> value')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.value('foo')
      })

      it('partial match', function () {
        expect(this.$input).to.contain.value('oo')
        expect(this.$input).to.not.contain.value('oof')
        // make sure "includes" is an alias of "include"
        expect(this.$input).to.includes.value('oo')
        cy.get('input')
        .invoke('val', 'foobar')
        .should('contain.value', 'bar')
        .should('contain.value', 'foo')
        .should('include.value', 'foo')

        cy.wrap(null).then(() => {
          cy.$$('<input value="foo1">').prependTo(cy.$$('body'))

          cy.$$('<input value="foo2">').prependTo(cy.$$('body'))
        })

        cy.get('input').should(($els) => {
          expect($els).to.have.value('foo2')
          expect($els).to.contain.value('foo')

          expect($els).to.include.value('foo')
        }).should('contain.value', 'oo2')
      })

      // https://github.com/cypress-io/cypress/issues/14359
      it('shows undefined correctly', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')
            expect(log.get('message')).to.eq('expected **undefined** to have value **somevalue**')

            done()
          }
        })

        cy.wrap(undefined).should('have.value', 'somevalue')
      })

      it('shows the searched content instead of undefined when a previous traversal errors', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')
            expect(log.get('message')).to.eq('expected **Does not exist** to have class **updated**')
            done()
          }
        })

        cy.get('body')
        .contains('Does not exist')
        .should('have.class', 'updated')
      })
    })

    context('descendants', () => {
      beforeEach(function () {
        this.$div = $('<div><button>button</button></div>')
        this.$div.has = function () {
          throw new Error('has called')
        }
      })

      it('descendants, not descendants', function () {
        expect(this.$div).to.have.descendants('button') // 1
        expect(this.$div).not.to.have.descendants('input') // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have descendants **button**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to have descendants **input**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have descendants \'foo\'',
          )

          expect(err.message).to.include('> descendants')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.descendants('foo')
      })
    })

    context('exist', () => {
      it('passes thru non DOM', function () {
        expect([]).to.exist
        expect({}).to.exist
        expect('foo').to.exist

        assertLogLength(this.logs, 3)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]

        expect(l1.get('message')).to.eq(
          'expected **[]** to exist',
        )

        expect(l2.get('message')).to.eq(
          'expected **{}** to exist',
        )

        expect(l3.get('message')).to.eq(
          'expected **foo** to exist',
        )
      })
    })

    context('empty', () => {
      beforeEach(function () {
        this.div = $('<div></div>')
        this.div.is = function () {
          throw new Error('is called')
        }

        this.div2 = $('<div><button>button</button></div>')
        this.div2.is = function () {
          throw new Error('is called')
        }
      })

      it('passes thru non DOM', function () {
        expect([]).to.be.empty
        expect({}).to.be.empty
        expect('').to.be.empty

        assertLogLength(this.logs, 3)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]

        expect(l1.get('message')).to.eq(
          'expected **[]** to be empty',
        )

        expect(l2.get('message')).to.eq(
          'expected **{}** to be empty',
        )

        expect(l3.get('message')).to.eq(
          'expected **\'\'** to be empty',
        )
      })

      it('empty, not empty, raw dom documents', function () {
        expect(this.div).to.be.empty // 1
        expect(this.div2).not.to.be.empty // 2

        expect(this.div.get(0)).to.be.empty // 3
        expect(this.div2.get(0)).not.to.be.empty // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to be **empty**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to be **empty**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** to be **empty**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to be **empty**',
        )
      })
    })

    context('match', () => {
      beforeEach(function () {
        this.div = $('<div></div>')
        this.div.is = function () {
          throw new Error('is called')
        }
      })

      it('passes thru non DOM', function () {
        expect('foo').to.match(/f/)

        assertLogLength(this.logs, 1)

        const l1 = this.logs[0]

        expect(l1.get('message')).to.eq(
          'expected **foo** to match /f/',
        )
      })

      it('match, not match, raw dom documents', function () {
        expect(this.div).to.match('div') // 1
        expect(this.div).not.to.match('button') // 2

        expect(this.div.get(0)).to.match('div') // 3
        expect(this.div.get(0)).not.to.match('button') // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to match **div**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to match **button**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** to match **div**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to match **button**',
        )
      })
    })

    context('contain', () => {
      it('passes thru non DOM', function () {
        expect(['foo']).to.contain('foo') // 1
        expect({ foo: 'bar', baz: 'quux' }).to.contain({ foo: 'bar' }) // 2, 3
        expect('foo').to.contain('fo') // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **[ foo ]** to include **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **{ foo: bar, baz: quux }** to have property **foo**',
        )

        expect(l3.get('message')).to.eq(
          'expected **{ foo: bar, baz: quux }** to have property **foo** of **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **foo** to include **fo**',
        )
      })
    })
  })
})
