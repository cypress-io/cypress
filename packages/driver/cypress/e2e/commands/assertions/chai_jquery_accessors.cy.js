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

    context('attr', () => {
      beforeEach(function () {
        this.$div = $('<div foo=\'bar\'>foo</div>')
        this.$div.attr = function () {
          throw new Error('attr called')
        }

        this.$a = $('<a href=\'https://google.com\'>google</a>')
        this.$a.attr = function () {
          throw new Error('attr called')
        }
      })

      it('attr, not attr', function () {
        expect(this.$div).to.have.attr('foo') // 1
        expect(this.$div).to.have.attr('foo', 'bar') // 2
        expect(this.$div).not.to.have.attr('bar') // 3
        expect(this.$div).not.to.have.attr('bar', 'baz') // 4
        expect(this.$div).not.to.have.attr('foo', 'baz') // 5

        expect(this.$a).to.have.attr('href').and.match(/google/) // 6, 7
        expect(this.$a)
        .to.have.attr('href', 'https://google.com') // 8
        .and.have.text('google') // 9

        try {
          expect(this.$a).not.to.have.attr('href', 'https://google.com') // 10
        } catch (error) {} // eslint-disable-line no-empty

        assertLogLength(this.logs, 10)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]
        const l5 = this.logs[4]
        const l6 = this.logs[5]
        const l7 = this.logs[6]
        const l8 = this.logs[7]
        const l9 = this.logs[8]
        const l10 = this.logs[9]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have attribute **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** to have attribute **foo** with the value **bar**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** not to have attribute **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to have attribute **bar**',
        )

        expect(l5.get('message')).to.eq(
          'expected **<div>** not to have attribute **foo** with the value **baz**',
        )

        expect(l6.get('message')).to.eq(
          'expected **<a>** to have attribute **href**',
        )

        expect(l7.get('message')).to.eq(
          'expected **https://google.com** to match /google/',
        )

        expect(l8.get('message')).to.eq(
          'expected **<a>** to have attribute **href** with the value **https://google.com**',
        )

        expect(l9.get('message')).to.eq(
          'expected **<a>** to have text **google**',
        )

        expect(l10.get('message')).to.eq(
          'expected **<a>** not to have attribute **href** with the value **https://google.com**, but the value was **https://google.com**',
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#attr-number').then(($el) => {
          expect($el).to.have.attr('num', 777)
          expect($el).to.have.attr('num', '777')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have attribute \'foo\'',
          )

          expect(err.message).to.include('> attr')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.attr('foo')
      })

      it('throws when the attribute name is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include(
            'The `attr` assertion requires the attribute name to be a string. You passed: `{ width: \'200px\' }`',
          )

          // jQuery would have set the attribute rather than read it
          expect(this.$div[0].getAttribute('width')).to.be.null

          done()
        })

        expect(this.$div).to.have.attr({ width: '200px' })
      })
    })

    context('prop', () => {
      beforeEach(function () {
        this.$input = $('<input type=\'checkbox\' />')
        this.$input.prop('checked', true)
        this.$input.prop = function () {
          throw new Error('prop called')
        }

        this.$a = $('<a href=\'/foo\'>google</a>')
        this.$a.prop = function () {
          throw new Error('prop called')
        }
      })

      it('prop, not prop', function () {
        expect(this.$input).to.have.prop('checked') // 1
        expect(this.$input).to.have.prop('checked', true) // 2
        expect(this.$input).not.to.have.prop('bar') // 3
        expect(this.$input).not.to.have.prop('bar', 'baz') // 4
        expect(this.$input).not.to.have.prop('checked', 'baz') // 5

        const href = `${window.location.origin}/foo`

        expect(this.$a).to.have.prop('href').and.match(/foo/) // 6, 7
        expect(this.$a)
        .to.have.prop('href', href) // 8
        .and.have.text('google') // 9

        try {
          expect(this.$a).not.to.have.prop('href', href) // 10
        } catch (error) {} // eslint-disable-line no-empty

        assertLogLength(this.logs, 10)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]
        const l5 = this.logs[4]
        const l6 = this.logs[5]
        const l7 = this.logs[6]
        const l8 = this.logs[7]
        const l9 = this.logs[8]
        const l10 = this.logs[9]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to have property **checked**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** to have property **checked** with the value **true**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<input>** not to have property **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<input>** not to have property **bar**',
        )

        expect(l5.get('message')).to.eq(
          'expected **<input>** not to have property **checked** with the value **baz**',
        )

        expect(l6.get('message')).to.eq(
          'expected **<a>** to have property **href**',
        )

        expect(l7.get('message')).to.eq(
          `expected **${href}** to match /foo/`,
        )

        expect(l8.get('message')).to.eq(
          `expected **<a>** to have property **href** with the value **${href}**`,
        )

        expect(l9.get('message')).to.eq(
          'expected **<a>** to have text **google**',
        )

        expect(l10.get('message')).to.eq(
          `expected **<a>** not to have property **href** with the value **${href}**, but the value was **${href}**`,
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#prop-number').then(($el) => {
          $el.prop('foo', 444)
          $el.prop('bar', '333')

          expect($el).to.have.prop('foo', 444)
          expect($el).not.to.have.prop('foo', '444')
          expect($el).not.to.have.prop('bar', 333)
          expect($el).to.have.prop('bar', '333')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have property \'foo\'',
          )

          expect(err.message).to.include('> prop')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.prop('foo')
      })

      // https://github.com/cypress-io/cypress/issues/26451
      it('throws when the property name is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include(
            'The `prop` assertion requires the property name to be a string. You passed: `{ checked: false }`',
          )

          expect(this.$input[0].checked).to.be.true

          done()
        })

        expect(this.$input).to.have.prop({ checked: false })
      })
    })

    context('css', () => {
      beforeEach(function () {
        this.$div = $('<div style=\'display: none\'>div</div>')
        this.$div.css = function () {
          throw new Error('css called')
        }
      })

      it('css, not css', function () {
        expect(this.$div).to.have.css('display') // 1
        expect(this.$div).to.have.css('display', 'none') // 2
        expect(this.$div).not.to.have.css('bar') // 3
        expect(this.$div).not.to.have.css('bar', 'baz') // 4
        expect(this.$div).not.to.have.css('display', 'inline') // 5

        try {
          expect(this.$div).not.to.have.css('display', 'none') // 6
        } catch (error) {} // eslint-disable-line no-empty

        assertLogLength(this.logs, 6)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]
        const l5 = this.logs[4]
        const l6 = this.logs[5]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have CSS property **display**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** to have CSS property **display** with the value **none**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** not to have CSS property **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to have CSS property **bar**',
        )

        expect(l5.get('message')).to.eq(
          'expected **<div>** not to have CSS property **display** with the value **inline**',
        )

        expect(l6.get('message')).to.eq(
          'expected **<div>** not to have CSS property **display** with the value **none**, but the value was **none**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have CSS property \'foo\'',
          )

          expect(err.message).to.include('> css')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.css('foo')
      })

      // https://github.com/cypress-io/cypress/issues/26451
      it('throws when the CSS property name is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include(
            'The `css` assertion requires the CSS property name to be a string. You passed: `{ backgroundColor: \'rgb(128, 0, 0)\' }`',
          )

          expect(this.$div[0].style.backgroundColor).to.eq('')

          done()
        })

        expect(this.$div).to.have.css({ backgroundColor: 'rgb(128, 0, 0)' })
      })

      // https://github.com/cypress-io/cypress/issues/26451
      it('fails a should() without retrying and without styling the subject', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include(
            'The `css` assertion requires the CSS property name to be a string.',
          )

          expect(err.message).to.not.include('Timed out retrying')
          expect(cy.$$('#attr-number')[0].style.backgroundColor).to.eq('')

          done()
        })

        cy.get('#attr-number').should('have.css', { backgroundColor: 'rgb(128, 0, 0)' })
      })
    })
  })
})
