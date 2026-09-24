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

    context('visible', () => {
      beforeEach(function () {
        this.$div = $('<div>div</div>').appendTo($('body'))
        this.$div.is = function () {
          throw new Error('is called')
        }

        this.$div2 = $('<div style=\'display: none\'>div</div>').appendTo($('body'))
        this.$div2.is = function () {
          throw new Error('is called')
        }
      })

      afterEach(function () {
        this.$div.remove()

        this.$div2.remove()
      })

      it('visible, not visible, adds to error', function () {
        cy.once('fail', (err) => {
          const l6 = this.logs[5]

          // the error on this log should have this message appended to it
          expect(l6.get('error').message).to.include(`expected '<div>' to be 'visible'`)
          expect(err.message).to.match(/This element `<div>` is not visible/)
        })

        expect(this.$div).to.be.visible // 1
        expect(this.$div2).not.to.be.visible // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to be **visible**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to be **visible**',
        )

        expect(this.$div2).to.be.visible
      })
    })

    context('hidden', () => {
      beforeEach(function () {
        this.$div = $('<div style=\'display: none\'>div</div>').appendTo($('body'))
        this.$div.is = function () {
          throw new Error('is called')
        }

        this.$div2 = $('<div>div</div>').appendTo($('body'))
        this.$div2.is = function () {
          throw new Error('is called')
        }
      })

      afterEach(function () {
        this.$div.remove()

        this.$div2.remove()
      })

      it('hidden, not hidden, adds to error', function () {
        expect(this.$div).to.be.hidden // 1
        expect(this.$div2).not.to.be.hidden // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to be **hidden**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to be **hidden**',
        )

        try {
          expect(this.$div2).to.be.hidden
        } catch (err) {
          const l6 = this.logs[5]

          // the error on this log should have this message appended to it
          expect(l6.get('error').message).to.eq('expected \'<div>\' to be \'hidden\'')
        }
      })
    })

    context('selected', () => {
      beforeEach(function () {
        this.$option = $('<option selected>option</option>')
        this.$option.is = function () {
          throw new Error('is called')
        }

        this.$option2 = $('<option>option</option>')
        this.$option2.is = function () {
          throw new Error('is called')
        }
      })

      it('selected, not selected', function () {
        expect(this.$option).to.be.selected // 1
        expect(this.$option2).not.to.be.selected // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<option>** to be **selected**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<option>** not to be **selected**',
        )
      })
    })

    context('checked', () => {
      beforeEach(function () {
        this.$input = $('<input type=\'checkbox\' checked />')
        this.$input.is = function () {
          throw new Error('is called')
        }

        this.$input2 = $('<input type=\'checkbox\' />')
        this.$input2.is = function () {
          throw new Error('is called')
        }
      })

      it('checked, not checked', function () {
        expect(this.$input).to.be.checked // 1
        expect(this.$input2).not.to.be.checked // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to be **checked**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to be **checked**',
        )
      })
    })

    context('enabled', () => {
      beforeEach(function () {
        this.$input = $('<input />')
        this.$input.is = function () {
          throw new Error('is called')
        }

        this.$input2 = $('<input disabled />')
        this.$input2.is = function () {
          throw new Error('is called')
        }
      })

      it('enabled, not enabled', function () {
        expect(this.$input).to.be.enabled // 1
        expect(this.$input2).not.to.be.enabled // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to be **enabled**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to be **enabled**',
        )
      })
    })

    context('disabled', () => {
      beforeEach(function () {
        this.$input = $('<input disabled />')
        this.$input.is = function () {
          throw new Error('is called')
        }

        this.$input2 = $('<input />')
        this.$input2.is = function () {
          throw new Error('is called')
        }
      })

      it('disabled, not disabled', function () {
        expect(this.$input).to.be.disabled // 1
        expect(this.$input2).not.to.be.disabled // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to be **disabled**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to be **disabled**',
        )
      })
    })

    context('focused', () => {
      beforeEach(function () {
        this.div = $('<div id=\'div\' tabindex=0></div>').appendTo($('body'))
        this.div.is = function () {
          throw new Error('is called')
        }

        this.div2 = $('<div id=\'div2\' tabindex=1><button>button</button></div>').appendTo($('body'))
        this.div2.is = function () {
          throw new Error('is called')
        }
      })

      it('focus, not focus, raw dom documents', function () {
        expect(this.div).to.not.be.focused
        expect(this.div[0]).to.not.be.focused
        this.div.focus()
        expect(this.div).to.be.focused
        expect(this.div[0]).to.be.focused

        this.div.blur()
        expect(this.div).to.not.be.focused
        expect(this.div[0]).to.not.be.focused

        expect(this.div2).not.to.be.focused
        expect(this.div2[0]).not.to.be.focused
        this.div.focus()
        expect(this.div2).not.to.be.focused
        this.div2.focus()
        expect(this.div2).to.be.focused

        assertLogLength(this.logs, 10)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **<div#div>** not to be **focused**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div#div>** not to be **focused**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div#div>** to be **focused**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div#div>** to be **focused**',
        )
      })

      it('works with focused or focus', function () {
        expect(this.div).to.not.have.focus
        expect(this.div).to.not.have.focused
        expect(this.div).to.not.be.focus
        expect(this.div).to.not.be.focused

        cy.get('#div').should('not.be.focused')

        cy.get('#div').should('not.have.focus')
      })

      it('works with multiple elements', () => {
        cy.get('div:last').focus()
        cy.get('div').should('have.focus')
        cy.get('div:last').blur()

        cy.get('div').should('not.have.focus')
      })
    })
  })
})
