const $ = Cypress.$.bind(Cypress)
const { _ } = Cypress
const { Promise } = Cypress
const { getCommandLogWithText, findReactInstance, withMutableReporterState, attachListeners, shouldBeCalledWithCount } = require('../../../support/utils')

const keyEvents = [
  'keydown',
  'keyup',
  'keypress',
  'input',
  'textInput',
]
const attachKeyListeners = attachListeners(keyEvents)

// trim new lines at the end of innerText
// due to changing browser versions implementing
// this differently
const trimInnerText = ($el) => {
  return _.trimEnd($el.get(0).innerText, '\n')
}

describe('src/cy/commands/actions/type', () => {
  before(() => {
    cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      const el = cy.$$('[contenteditable]:first').get(0)

      // by default... the last new line by itself
      // will only ever count as a single new line...
      // but new lines above it will count as 2 new lines...
      // so by adding "3" new lines, the last counts as 1
      // and the first 2 count as 2...
      el.innerHTML = '<div><br></div>'.repeat(3)

      // browsers changed their implementation
      // of the number of newlines that <div><br></div>
      // create. newer versions of chrome set 2 new lines
      // per set - whereas older ones create only 1 new line.
      // so we grab the current sets for the assertion later
      // so this test is browser version agnostic
      const newLines = el.innerText

      // disregard the last new line, and divide by 2...
      // this tells us how many multiples of new lines
      // the browser inserts for new lines other than
      // the last new line
      this.multiplierNumNewLines = (newLines.length - 1) / 2
    })
  })

  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#type', () => {
    it('does not change the subject', () => {
      const input = cy.$$('input:first')

      cy.get('input:first').type('foo').then(($input) => {
        expect($input).to.match(input)
      })
    })

    it('changes the value', () => {
      const input = cy.$$('input:text:first')

      input.val('')

      // make sure we are starting from a
      // clean state
      expect(input).to.have.value('')

      cy.get('input:text:first').type('foo').then(($input) => {
        expect($input).to.have.value('foo')
      })
    })

    it('appends subsequent type commands', () => {
      cy
      .get('input:first').type('123')
      .then(($el) => {
        $el[0].setSelectionRange(0, 0)
      })
      .blur()
      .type('456')
      .should('have.value', '123456')
    })

    it('appends subsequent commands when value is changed in between', () => {
      cy
      .get('input:first')
      .type('123')
      .then(($input) => {
        $input[0].value += '-'

        return $input
      }).type('456')
      .should('have.value', '123-456')
    })

    it('can type numbers', () => {
      cy.get(':text:first').type(123).then(($text) => {
        expect($text).to.have.value('123')
      })
    })

    it('triggers focus event on the input', (done) => {
      cy.$$('input:text:first').focus(() => {
        done()
      })

      cy.get('input:text:first').type('bar')
    })

    it('lists the input as the focused element', () => {
      const $input = cy.$$('input:text:first')

      cy.get('input:text:first').type('bar').focused().then(($focused) => {
        expect($focused.get(0)).to.eq($input.get(0))
      })
    })

    it('causes previous input to receive blur', () => {
      let blurred = false

      cy.$$('input:text:first').blur(() => {
        blurred = true
      })

      cy.get('input:text:first').type('foo')
      cy.get('input:text:last').type('bar')
      .then(() => {
        expect(blurred).to.be.true
      })
    })

    // cursor should be moved to the end before type, so text is appended
    it('can type into contenteditable', () => {
      const oldText = cy.$$('#contenteditable').get(0).innerText

      cy.get('#contenteditable')
      .type(' foo')
      .then(($div) => {
        expect($div.get(0).innerText).to.eq((`${oldText} foo`))
      })
    })

    it('delays 50ms before resolving', () => {
      cy.$$(':text:first').on('change', (e) => {
        cy.spy(Promise, 'delay')
      })

      cy.get(':text:first').type('foo{enter}').then(() => {
        expect(Promise.delay).to.be.calledWith(50, 'type')
      })
    })

    it('increases the timeout delta', () => {
      cy.spy(cy, 'timeout')

      cy.get(':text:first').type('foo{enter}').then(() => {
        expect(cy.timeout).to.be.calledWith(40, true, 'type')

        expect(cy.timeout).to.be.calledWith(50, true, 'type')
      })
    })

    it('accepts body as subject', () => {
      cy.get('body').type('foo')
    })

    it('does not click when body is subject', () => {
      const clicked = cy.stub()

      cy.$$('body').on('click', clicked)

      cy.get('body').type('foo').then(() => {
        expect(clicked).not.to.be.calledOnce
      })
    })

    it('can type into element that redirects focus', () => {
      const $firstTabIndexEl = cy.$$('div[tabindex]:first')

      $firstTabIndexEl.on('focus', () => {
        cy.$$('input:first').focus()
      })

      cy.get('div[tabindex]:first').type('foobar').then(($subject) => {
        // should not have changed the subject
        expect($subject.get(0)).to.eq($firstTabIndexEl.get(0))
      })

      cy.get('input:first')
      .should('be.focused')
      .should('have.value', 'foobar')
    })

    describe('actionability', () => {
      it('can forcibly type + click even when element is invisible', () => {
        const $txt = cy.$$(':text:first').hide()

        expect($txt).not.to.have.value('foo')

        const clicked = cy.stub()

        $txt.on('click', clicked)

        cy.get(':text:first').type('foo', { force: true }).then(($input) => {
          expect(clicked).to.be.calledOnce

          expect($input).to.have.value('foo')
        })
      })

      it('can force type when element is disabled', function () {
        cy.$$('input:text:first').prop('disabled', true)
        cy.get('input:text:first').type('foo', { force: true })
        .should('have.value', 'foo')
      })

      it('can forcibly type + click even when being covered by another element', () => {
        const $input = $('<input />')
        .attr('id', 'input-covered-in-span')
        .css({
          width: 50,
        })
        .prependTo(cy.$$('body'))

        $('<span>span on input</span>')
        .css({
          position: 'absolute',
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: 'inline-block',
          backgroundColor: 'yellow',
        })
        .prependTo(cy.$$('body'))

        const clicked = cy.stub()

        $input.on('click', clicked)

        cy.get('#input-covered-in-span').type('foo', { force: true }).then(($input) => {
          expect(clicked).to.be.calledOnce

          expect($input).to.have.value('foo')
        })
      })

      it('waits until element becomes visible', () => {
        const $txt = cy.$$(':text:first').hide()

        const retried = cy.stub()

        cy.on('command:retry', _.after(3, () => {
          $txt.show()
          retried()
        }))

        cy.get(':text:first').type('foo').then(() => {
          expect(retried).to.be.called
        })
      })

      it('waits until element is no longer disabled', () => {
        const $txt = cy.$$(':text:first').prop('disabled', true)

        const retried = cy.stub()
        const clicked = cy.stub()

        $txt.on('click', clicked)

        cy.on('command:retry', _.after(3, () => {
          $txt.prop('disabled', false)
          retried()
        }))

        cy.get(':text:first').type('foo').then(() => {
          expect(clicked).to.be.calledOnce

          expect(retried).to.be.called
        })
      })

      it('waits until element is no longer readonly', () => {
        const $txt = cy.$$(':text:first').prop('readonly', true)

        const retried = cy.stub()
        const clicked = cy.stub()

        $txt.on('click', clicked)

        cy.on('command:retry', _.after(3, () => {
          $txt.prop('readonly', false)
          retried()
        }))

        cy.get(':text:first').type('foo').then(() => {
          expect(clicked).to.be.calledOnce

          expect(retried).to.be.called
        })
      })

      it('waits until element stops animating', () => {
        const retried = cy.stub()

        cy.on('command:retry', retried)

        cy.stub(cy, 'ensureElementIsNotAnimating')
        .throws(new Error('animating!'))
        .onThirdCall().returns()

        cy.get(':text:first').type('foo').then(() => {
          // - retry animation coords
          // - retry animation
          // - retry animation
          expect(retried).to.be.calledThrice

          expect(cy.ensureElementIsNotAnimating).to.be.calledThrice
        })
      })

      it('does not throw when waiting for animations is disabled', () => {
        cy.stub(cy, 'ensureElementIsNotAnimating').throws(new Error('animating!'))
        Cypress.config('waitForAnimations', false)

        cy.get(':text:first').type('foo').then(() => {
          expect(cy.ensureElementIsNotAnimating).not.to.be.called
        })
      })

      it('does not throw when turning off waitForAnimations in options', () => {
        cy.stub(cy, 'ensureElementIsNotAnimating').throws(new Error('animating!'))

        cy.get(':text:first').type('foo', { waitForAnimations: false }).then(() => {
          expect(cy.ensureElementIsNotAnimating).not.to.be.called
        })
      })

      it('passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating', () => {
        const $txt = cy.$$(':text:first')

        const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($txt)

        cy.spy(cy, 'ensureElementIsNotAnimating')

        cy.get(':text:first').type('foo', { animationDistanceThreshold: 1000 }).then(() => {
          const { args } = cy.ensureElementIsNotAnimating.firstCall

          expect(args[1]).to.deep.eq([fromElWindow, fromElWindow])

          expect(args[2]).to.eq(1000)
        })
      })

      it('passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating', () => {
        const animationDistanceThreshold = Cypress.config('animationDistanceThreshold')

        const $txt = cy.$$(':text:first')

        const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($txt)

        cy.spy(cy, 'ensureElementIsNotAnimating')

        cy.get(':text:first').type('foo').then(() => {
          const { args } = cy.ensureElementIsNotAnimating.firstCall

          expect(args[1]).to.deep.eq([fromElWindow, fromElWindow])

          expect(args[2]).to.eq(animationDistanceThreshold)
        })
      })
    })

    describe('input types where no extra formatting required', () => {
      _.each([
        'password',
        'email',
        'number',
        'search',
        'url',
        'tel',
      ], (type) => {
        it(`accepts input [type=${type}]`, () => {
          const input = cy.$$(`<input type='${type}' id='input-type-${type}' />`)

          cy.$$('body').append(input)

          cy.get(`#input-type-${type}`).type('1234').then(($input) => {
            expect($input).to.have.value('1234')

            expect($input.get(0)).to.eq($input.get(0))
          })
        })

        it(`accepts type [type=${type}], regardless of capitalization`, () => {
          const input = cy.$$(`<input type='${type.toUpperCase()}' id='input-type-${type}' />`)

          cy.$$('body').append(input)

          cy.get(`#input-type-${type}`).type('1234')
        })
      })
    })

    describe('tabindex', () => {
      beforeEach(function () {
        this.$div = cy.$$('#tabindex')
      })

      it('receives keydown, keyup, keypress', function () {
        let keydown = false
        let keypress = false
        let keyup = false

        this.$div.keydown(() => {
          keydown = true
        })

        this.$div.keypress(() => {
          keypress = true
        })

        this.$div.keyup(() => {
          keyup = true
        })

        cy.get('#tabindex').type('a').then(() => {
          expect(keydown).to.be.true
          expect(keypress).to.be.true

          expect(keyup).to.be.true
        })
      })

      it('does not receive textInput', function () {
        let textInput = false

        this.$div.on('textInput', () => {
          textInput = true
        })

        cy.get('#tabindex').type('f').then(() => {
          expect(textInput).to.be.false
        })
      })

      it('does not receive input', function () {
        let input = false

        this.$div.on('input', () => {
          input = true
        })

        cy.get('#tabindex').type('f').then(() => {
          expect(input).to.be.false
        })
      })

      it('does not receive change event', function () {
        const innerText = this.$div.text()

        let change = false

        this.$div.on('change', () => {
          change = true
        })

        cy.get('#tabindex').type('foo{enter}').then(($el) => {
          expect(change).to.be.false

          expect($el.text()).to.eq(innerText)
        })
      })

      it('does not change inner text', function () {
        const innerText = this.$div.text()

        cy.get('#tabindex').type('foo{leftarrow}{del}{rightarrow}{enter}').should('have.text', innerText)
      })

      it('receives focus', function () {
        let focus = false

        this.$div.focus(() => {
          focus = true
        })

        cy.get('#tabindex').type('f').then(() => {
          expect(focus).to.be.true
        })
      })

      it('receives blur', function () {
        let blur = false

        this.$div.blur(() => {
          blur = true
        })

        cy.get('#tabindex').type('f')
        cy.get('input:first').focus().then(() => {
          expect(blur).to.be.true
        })
      })

      it('receives keydown and keyup for other special characters and keypress for enter and regular characters', function () {
        const keydowns = []
        const keyups = []
        const keypresses = []

        this.$div.keydown((e) => {
          return keydowns.push(e)
        })

        this.$div.keypress((e) => {
          return keypresses.push(e)
        })

        this.$div.keyup((e) => {
          return keyups.push(e)
        })

        cy.get('#tabindex').type('f{leftarrow}{rightarrow}{enter}')
        .then(() => {
          expect(keydowns).to.have.length(4)
          expect(keypresses).to.have.length(2)

          expect(keyups).to.have.length(4)
        })
      })
    })

    describe('delay', () => {
      it('adds delay to delta for each key sequence', () => {
        cy.spy(cy, 'timeout')

        cy.get(':text:first')
        .type('foo{enter}bar{leftarrow}', { delay: 5 })
        .then(() => {
          expect(cy.timeout).to.be.calledWith(5 * 8, true, 'type')
        })
      })

      it('can cancel additional keystrokes', (done) => {
        cy.stub(Cypress.runner, 'stop')

        const text = cy.$$(':text:first').keydown(_.after(3, () => {
          Cypress.stop()
        }))

        cy.on('stop', () => {
          return _.delay(() => {
            expect(text).to.have.value('foo')

            done()
          }
          , 50)
        })

        cy.get(':text:first').type('foo{enter}bar{leftarrow}')
      })
    })

    describe('events', () => {
      it('receives keydown event', (done) => {
        const $txt = cy.$$(':text:first')

        $txt.on('keydown', (e) => {
          expect(_.toPlainObject(e.originalEvent)).to.include({
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 0, // deprecated
            ctrlKey: false,
            detail: 0,
            key: 'a',
            // has code property https://github.com/cypress-io/cypress/issues/3722
            code: 'KeyA',
            keyCode: 65, // deprecated but fired by chrome always uppercase in the ASCII table
            location: 0,
            metaKey: false,
            repeat: false,
            shiftKey: false,
            type: 'keydown',
            which: 65, // deprecated but fired by chrome
          })

          done()
        })

        cy.get(':text:first').type('a')
      })

      it('receives keypress event', (done) => {
        const $txt = cy.$$(':text:first')

        $txt.on('keypress', (e) => {
          expect(_.toPlainObject(e.originalEvent)).to.include({
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 97, // deprecated
            ctrlKey: false,
            detail: 0,
            key: 'a',
            code: 'KeyA',
            keyCode: 97, // deprecated
            location: 0,
            metaKey: false,
            repeat: false,
            shiftKey: false,
            type: 'keypress',
            which: 97, // deprecated
          })

          done()
        })

        cy.get(':text:first').type('a')
      })

      it('receives keyup event', (done) => {
        const $txt = cy.$$(':text:first')

        $txt.on('keyup', (e) => {
          expect(_.toPlainObject(e.originalEvent)).to.include({
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 0, // deprecated
            ctrlKey: false,
            detail: 0,
            key: 'a',
            code: 'KeyA',
            keyCode: 65, // deprecated but fired by chrome always uppercase in the ASCII table
            location: 0,
            metaKey: false,
            repeat: false,
            shiftKey: false,
            type: 'keyup',
            view: cy.state('window'),
            which: 65, // deprecated but fired by chrome
          })

          done()
        })

        cy.get(':text:first').type('a')
      })

      it('receives textInput event', (done) => {
        const $txt = cy.$$(':text:first')

        $txt.on('textInput', (e) => {
          const obj = _.pick(e.originalEvent, 'bubbles', 'cancelable', 'charCode', 'data', 'detail', 'keyCode', 'layerX', 'layerY', 'pageX', 'pageY', 'type', 'view', 'which')

          expect(obj).to.deep.eq({
            bubbles: true,
            cancelable: true,
            data: 'a',
            detail: 0,
            type: 'textInput',
            view: cy.state('window'),
            which: 0,
          })

          done()
        })

        cy.get(':text:first').type('a')
      })

      it('receives input event', (done) => {
        const $txt = cy.$$(':text:first')

        $txt.on('input', (e) => {
          const obj = _.pick(e.originalEvent, 'bubbles', 'cancelable', 'type')

          expect(obj).to.deep.eq({
            bubbles: true,
            cancelable: false,
            type: 'input',
          })

          done()
        })

        cy.get(':text:first').type('a')
      })

      it('fires events in the correct order')

      it('fires events for each key stroke')

      it('does fire input event when value changes', () => {
        const onInput = cy.stub()

        cy.$$(':text:first').on('input', onInput)

        cy.get(':text:first')
        .invoke('val', 'bar')
        .type('{selectAll}{rightarrow}{backspace}')
        .then(() => {
          expect(onInput).to.be.calledOnce
        })
        .then(() => {
          onInput.reset()
        })

        cy.get(':text:first')
        .invoke('val', 'bar')
        .type('{selectAll}{leftarrow}{del}')
        .then(() => {
          expect(onInput).to.be.calledOnce
        })
        .then(() => {
          onInput.reset()
        })

        cy.$$('[contenteditable]:first').on('input', onInput)

        cy.get('[contenteditable]:first')
        .invoke('html', 'foobar')
        .type('{selectAll}{rightarrow}{backspace}')
        .then(() => {
          expect(onInput).to.be.calledOnce
        })
        .then(() => {
          onInput.reset()
        })

        cy.get('[contenteditable]:first')
        .invoke('html', 'foobar')
        .type('{selectAll}{leftarrow}{del}')
        .then(() => {
          expect(onInput).to.be.calledOnce
        })
      })

      it('does not fire input event when value does not change', () => {
        let fired = false

        cy.$$(':text:first').on('input', () => {
          fired = true
        })

        cy.get(':text:first')
        .invoke('val', 'bar')
        .type('{selectAll}{rightarrow}{del}')
        .then(() => {
          expect(fired).to.eq(false)
        })

        cy.get(':text:first')
        .invoke('val', 'bar')
        .type('{selectAll}{leftarrow}{backspace}')
        .then(() => {
          expect(fired).to.eq(false)
        })

        cy.$$('textarea:first').on('input', () => {
          fired = true
        })

        cy.get('textarea:first')
        .invoke('val', 'bar')
        .type('{selectAll}{rightarrow}{del}')
        .then(() => {
          expect(fired).to.eq(false)
        })

        cy.get('textarea:first')
        .invoke('val', 'bar')
        .type('{selectAll}{leftarrow}{backspace}')
        .then(() => {
          expect(fired).to.eq(false)
        })

        cy.$$('[contenteditable]:first').on('input', () => {
          fired = true
        })

        cy.get('[contenteditable]:first')
        .invoke('html', 'foobar')
        .type('{movetoend}')
        .then(($el) => {
          expect(fired).to.eq(false)
        })

        cy.get('[contenteditable]:first')
        .invoke('html', 'foobar')
        .type('{selectAll}{leftarrow}{backspace}')
        .then(() => {
          expect(fired).to.eq(false)
        })
      })
    })

    describe('maxlength', () => {
      it('limits text entered to the maxlength attribute of a text input', () => {
        const $input = cy.$$(':text:first')

        $input.attr('maxlength', 5)

        cy.get(':text:first')
        .type('1234567890')
        .then((input) => {
          expect(input).to.have.value('12345')
        })
      })

      it('ignores an invalid maxlength attribute', () => {
        const $input = cy.$$(':text:first')

        $input.attr('maxlength', 'five')

        cy.get(':text:first')
        .type('1234567890')
        .then((input) => {
          expect(input).to.have.value('1234567890')
        })
      })

      // https://github.com/cypress-io/cypress/issues/4587
      it('borrows property getter from outer frame for input', () => {
        const $input = cy.$$(':text:first')

        $input.attr('maxlength', 5)
        Object.defineProperty($input[0], 'maxLength', {
          value: 2,
        })

        cy.get(':text:first')
        .type('1234567890')
        .then((input) => {
          expect(input).to.have.value('12345')
        })
      })

      it('borrows property getter from outer frame for textarea', () => {
        const $input = cy.$$('textarea:first')

        $input.attr('maxlength', 5)
        Object.defineProperty($input[0], 'maxLength', {
          value: 2,
        })

        cy.get('textarea:first')
        .type('1234567890')
        .then((input) => {
          expect(input).to.have.value('12345')
        })
      })

      it('handles special characters', () => {
        const $input = cy.$$(':text:first')

        $input.attr('maxlength', 5)

        cy.get(':text:first')
        .type('12{selectall}')
        .then((input) => {
          expect(input).to.have.value('12')
        })
      })

      it('maxlength=0 events', () => {
        const events = []

        const push = (evt) => {
          return () => {
            return events.push(evt)
          }
        }

        cy
        .$$(':text:first')
        .attr('maxlength', 0)
        .on('keydown', push('keydown'))
        .on('keypress', push('keypress'))
        .on('textInput', push('textInput'))
        .on('input', push('input'))
        .on('keyup', push('keyup'))

        cy.get(':text:first')
        .type('1')
        .then(() => {
          expect(events).to.deep.eq([
            'keydown', 'keypress', 'textInput', 'keyup',
          ])
        })
      })

      it('maxlength=1 events', () => {
        const events = []

        const push = (evt) => {
          return () => {
            return events.push(evt)
          }
        }

        cy
        .$$(':text:first')
        .attr('maxlength', 1)
        .on('keydown', push('keydown'))
        .on('keypress', push('keypress'))
        .on('textInput', push('textInput'))
        .on('input', push('input'))
        .on('keyup', push('keyup'))

        cy.get(':text:first')
        .type('12')
        .then(() => {
          expect(events).to.deep.eq([
            'keydown', 'keypress', 'textInput', 'input', 'keyup',
            'keydown', 'keypress', 'textInput', 'keyup',
          ])
        })
      })
    })

    describe('value changing', () => {
      it('changes the elements value', () => {
        cy.get('#input-without-value').type('a').then(($text) => {
          expect($text).to.have.value('a')
        })
      })

      it('changes the elements value for multiple keys', () => {
        cy.get('#input-without-value').type('foo').then(($text) => {
          expect($text).to.have.value('foo')
        })
      })

      it('inserts text after existing text', () => {
        cy.get('#input-with-value').type(' bar').then(($text) => {
          expect($text).to.have.value('foo bar')
        })
      })

      it('inserts text after existing text input by invoking val', () => {
        cy.get('#input-without-value').invoke('val', 'foo').type(' bar').then(($text) => {
          expect($text).to.have.value('foo bar')
        })
      })

      it('overwrites text when currently has selection', () => {
        cy.get('#input-without-value').invoke('val', '0').then((el) => {
          return el.select()
        })

        cy.get('#input-without-value').type('50').then(($input) => {
          expect($input).to.have.value('50')
        })
      })

      it('overwrites text when selectAll in click handler', () => {
        cy.$$('#input-without-value').val('0').click(function () {
          $(this).select()
        })
      })

      // https://github.com/cypress-io/cypress/issues/5456
      it('respects changed selection in focus handler', () => {
        cy.get('#input-without-value')
        .then(($el) => {
          $el.val('foo')
          .on('focus', function (e) {
            e.currentTarget.setSelectionRange(0, 1)
          })
        })
        .type('bar')
        .should('have.value', 'baroo')
      })

      it('overwrites text when selectAll in mouseup handler', () => {
        cy.$$('#input-without-value').val('0').mouseup(function () {
          $(this).select()
        })
      })

      it('overwrites text when selectAll in mouseup handler', () => {
        cy.$$('#input-without-value').val('0').mouseup(function () {
          $(this).select()
        })
      })

      it('responsive to keydown handler', () => {
        cy.$$('#input-without-value').val('1234').keydown(function () {
          $(this).get(0).setSelectionRange(0, 0)
        })

        cy.get('#input-without-value').type('56').then(($input) => {
          expect($input).to.have.value('651234')
        })
      })

      it('responsive to keyup handler', () => {
        cy.$$('#input-without-value').val('1234').keyup(function () {
          $(this).get(0).setSelectionRange(0, 0)
        })

        cy.get('#input-without-value').type('56').then(($input) => {
          expect($input).to.have.value('612345')
        })
      })

      it('responsive to input handler', () => {
        cy.$$('#input-without-value').val('1234').keyup(function () {
          $(this).get(0).setSelectionRange(0, 0)
        })

        cy.get('#input-without-value').type('56').then(($input) => {
          expect($input).to.have.value('612345')
        })
      })

      it('responsive to change handler', () => {
        cy.$$('#input-without-value').val('1234').change(function () {
          $(this).get(0).setSelectionRange(0, 0)
        })

        // no change event should be fired
        cy.get('#input-without-value').type('56').then(($input) => {
          expect($input).to.have.value('123456')
        })
      })

      it('automatically moves the caret to the end if value is changed manually', () => {
        cy.$$('#input-without-value').keypress((e) => {
          e.preventDefault()

          const key = String.fromCharCode(e.which)

          const $input = $(e.target)

          const val = $input.val()

          // setting value updates cursor to the end of input
          $input.val(`${val + key}-`)
        })

        cy.get('#input-without-value').type('foo').then(($input) => {
          expect($input).to.have.value('f-o-o-')
        })
      })

      it('automatically moves the caret to the end if value is changed manually asynchronously', () => {
        cy.$$('#input-without-value').keypress((e) => {
          const $input = $(e.target)

          _.defer(() => {
            const val = $input.val()

            $input.val(`${val}-`)
          })
        })

        cy.get('#input-without-value').type('foo').then(($input) => {
          expect($input).to.have.value('f-o-o-')
        })
      })

      it('does not fire keypress when keydown is preventedDefault', (done) => {
        cy.$$('#input-without-value').get(0).addEventListener('keypress', () => {
          done('should not have received keypress event')
        })

        cy.$$('#input-without-value').get(0).addEventListener('keydown', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(() => {
          done()
        })
      })

      it('does not insert key when keydown is preventedDefault', () => {
        cy.$$('#input-without-value').get(0).addEventListener('keydown', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(($text) => {
          expect($text).to.have.value('')
        })
      })

      it('does not insert key when keypress is preventedDefault', () => {
        cy.$$('#input-without-value').get(0).addEventListener('keypress', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(($text) => {
          expect($text).to.have.value('')
        })
      })

      it('does not fire textInput when keypress is preventedDefault', (done) => {
        cy.$$('#input-without-value').get(0).addEventListener('textInput', () => {
          done('should not have received textInput event')
        })

        cy.$$('#input-without-value').get(0).addEventListener('keypress', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(() => {
          done()
        })
      })

      it('does not insert key when textInput is preventedDefault', () => {
        cy.$$('#input-without-value').get(0).addEventListener('textInput', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(($text) => {
          expect($text).to.have.value('')
        })
      })

      it('does not fire input when textInput is preventedDefault', (done) => {
        cy.$$('#input-without-value').get(0).addEventListener('input', (e) => {
          done('should not have received input event')
        })

        cy.$$('#input-without-value').get(0).addEventListener('textInput', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(() => {
          done()
        })
      })

      it('preventing default to input event should not affect anything', () => {
        cy.$$('#input-without-value').get(0).addEventListener('input', (e) => {
          e.preventDefault()
        })

        cy.get('#input-without-value').type('foo').then(($input) => {
          expect($input).to.have.value('foo')
        })
      })

      describe('input[type=number]', () => {
        it('can change values', () => {
          cy.get('#number-without-value').type('42').then(($text) => {
            expect($text).to.have.value('42')
          })
        })

        it('can input decimal', () => {
          cy.get('#number-without-value').type('2.0').then(($input) => {
            expect($input).to.have.value('2.0')
          })
        })

        it('can utilize {selectall}', () => {
          cy.get('#number-with-value').type('{selectall}99').then(($input) => {
            expect($input).to.have.value('99')
          })
        })

        it('can utilize arrows', () => {
          cy.get('#number-with-value').type('{leftarrow}{leftarrow}{rightarrow}9').then(($input) => {
            expect($input).to.have.value('192')
          })
        })

        it('inserts text after existing text ', () => {
          cy.get('#number-with-value').type('34').then(($text) => {
            expect($text).to.have.value('1234')
          })
        })

        it('inserts text after existing text input by invoking val', () => {
          cy.get('#number-without-value').invoke('val', '12').type('34').then(($text) => {
            expect($text).to.have.value('1234')
          })
        })

        it('overwrites text on input[type=number] when input has existing text selected', () => {
          cy.get('#number-without-value').invoke('val', '0').then((el) => {
            return el.get(0).select()
          })

          cy.get('#number-without-value').type('50').then(($input) => {
            expect($input).to.have.value('50')
          })
        })

        it('can type negative numbers', () => {
          cy.get('#number-without-value')
          .type('-123.12')
          .should('have.value', '-123.12')
        })

        it('can type {del}', () => {
          cy.get('#number-with-value')
          .type('{selectAll}{del}')
          .should('have.value', '')
        })

        it('can type {selectAll}{del}', () => {
          const sentInput = cy.stub()

          cy.get('#number-with-value')
          .then(($el) => $el.on('input', sentInput))
          .type('{selectAll}{del}')
          .should('have.value', '')
          .then(() => {
            expect(sentInput).to.be.calledOnce
          })
        })

        it('can type {selectAll}{del} without sending input event', () => {
          const sentInput = cy.stub()

          cy.get('#number-without-value')
          .then(($el) => $el.on('input', sentInput))
          .type('{selectAll}{del}')
          .should('have.value', '')
          .then(() => {
            expect(sentInput).not.to.be.called
          })
        })

        // https://github.com/cypress-io/cypress/issues/4767
        it('can type negative numbers with currently active selection', () => {
          cy.get('#number-without-value')
          .type('999')
          .type('{selectall}')
          .type('-123.12')
          .should('have.value', '-123.12')
        })

        it('type=number blurs consistently', () => {
          const blurred = cy.stub()

          cy.$$('#number-without-value').blur(blurred)

          cy.get('#number-without-value')
          .type('200').blur()
          .then(() => {
            expect(blurred).to.be.calledOnce
          })
        })
      })

      describe('input[type=email]', () => {
        it('can change values', () => {
          cy.get('#email-without-value').type('brian@foo.com').then(($text) => {
            expect($text).to.have.value('brian@foo.com')
          })
        })

        it('can utilize {selectall}', () => {
          cy.get('#email-with-value').type('{selectall}brian@foo.com').then(($text) => {
            expect($text).to.have.value('brian@foo.com')
          })
        })

        it('can utilize arrows', () => {
          cy.get('#email-with-value').type('{leftarrow}{rightarrow}om').then(($text) => {
            expect($text).to.have.value('brian@foo.com')
          })
        })

        it('inserts text after existing text', () => {
          cy.get('#email-with-value').type('om').then(($text) => {
            expect($text).to.have.value('brian@foo.com')
          })
        })

        it('inserts text after existing text input by invoking val', () => {
          cy.get('#email-without-value').invoke('val', 'brian@foo.c').type('om').then(($text) => {
            expect($text).to.have.value('brian@foo.com')
          })
        })

        it('overwrites text when input has existing text selected', () => {
          cy.get('#email-without-value').invoke('val', 'foo@bar.com').invoke('select')

          cy.get('#email-without-value').type('bar@foo.com').then(($input) => {
            expect($input).to.have.value('bar@foo.com')
          })
        })

        it('type=email blurs consistently', () => {
          const blurred = cy.stub()

          cy.$$('#email-without-value').blur(blurred)

          cy.get('#email-without-value')
          .type('foo@bar.com').blur()
          .then(() => {
            expect(blurred).to.be.calledOnce
          })
        })
      })

      describe('input[type=password]', () => {
        it('can change values', () => {
          cy.get('#password-without-value').type('password').then(($text) => {
            expect($text).to.have.value('password')
          })
        })

        it('inserts text after existing text', () => {
          cy.get('#password-with-value').type('word').then(($text) => {
            expect($text).to.have.value('password')
          })
        })

        it('inserts text after existing text input by invoking val', () => {
          cy.get('#password-without-value').invoke('val', 'secr').type('et').then(($text) => {
            expect($text).to.have.value('secret')
          })
        })

        it('overwrites text when input has existing text selected', () => {
          cy.get('#password-without-value').invoke('val', 'secret').invoke('select')

          cy.get('#password-without-value').type('agent').then(($input) => {
            expect($input).to.have.value('agent')
          })
        })

        it('overwrites text when input has selected range of text in click handler', () => {
          // e.preventDefault()
          cy.$$('#input-with-value').mouseup((e) => {
            e.target.setSelectionRange(1, 1)
          })

          const select = (e) => {
            e.target.select()
          }

          cy
          .$$('#password-without-value')
          .val('secret')
          .click(select)
          .keyup((e) => {
            switch (e.key) {
              case 'g':
                return select(e)
              case 'n':
                return e.target.setSelectionRange(0, 1)
              default:
            }
          })

          cy.get('#password-without-value').type('agent').then(($input) => {
            expect($input).to.have.value('tn')
          })
        })
      })

      describe('input[type=date]', () => {
        it('can change values', () => {
          cy.get('#date-without-value').type('1959-09-13').then(($text) => {
            expect($text).to.have.value('1959-09-13')
          })
        })

        it('overwrites existing value', () => {
          cy.get('#date-with-value').type('1959-09-13').then(($text) => {
            expect($text).to.have.value('1959-09-13')
          })
        })

        it('overwrites existing value input by invoking val', () => {
          cy.get('#date-without-value').invoke('val', '2016-01-01').type('1959-09-13').then(($text) => {
            expect($text).to.have.value('1959-09-13')
          })
        })
      })

      // https://github.com/cypress-io/cypress/issues/3661
      describe('various focusable elements', () => {
        it('<select> element', () => {
          let keydown = cy.stub()

          cy.get('select:first')
          .then(($el) => $el.on('keydown', keydown))
          .type('foo')
          .then(() => {
            expect(keydown).calledThrice
          })
        })

        it('<a> element', () => {
          let keydown = cy.stub()

          cy.get('a:first')
          .then(($el) => $el.on('keydown', keydown))
          .focus().type('foo')
          .then(() => expect(keydown).calledThrice)
        })

        it('<area> element', () => {
          cy.$$(`
          <map name="map">
          <area shape="circle" coords="0,0,100"
          href="#"
          target="_blank" alt="area" />
          </map>
          <img usemap="#map" src="/__cypress/static/favicon.ico" alt="image" />
          `).prependTo(cy.$$('body'))

          let keydown = cy.stub()

          cy.get('area:first')
          .then(($el) => $el.on('keydown', keydown))
          .focus().type('foo')
          .then(() => expect(keydown).calledThrice)
        })

        // https://github.com/cypress-io/cypress/issues/2166
        it('<button> element', () => {
          let keydown = cy.stub()
          let click = cy.stub()

          cy.get('button:first')
          .then(($el) => {
            $el.on('keydown', keydown)
            $el.on('click', click)
          })
          .focus().type('foo')
          .then(() => {
            expect(keydown).calledThrice
            expect(click).not.called
          })
        })
      })

      // https://github.com/cypress-io/cypress/issues/2613
      describe('input[type=datetime-local]', () => {
        it('can change values', () => {
          cy.get('[type="datetime-local"]').type('1959-09-13T10:10').should('have.value', '1959-09-13T10:10')
        })

        it('overwrites existing value', () => {
          cy.get('[type="datetime-local"]').type('1959-09-13T10:10').should('have.value', '1959-09-13T10:10')
        })

        it('overwrites existing value input by invoking val', () => {
          cy.get('[type="datetime-local"]').invoke('val', '2016-01-01T05:05').type('1959-09-13T10:10').should('have.value', '1959-09-13T10:10')
        })

        it('errors when invalid datetime', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).contain('datetime')
            expect(err.message).contain('yyyy-MM-ddThh:mm')
            done()
          })

          cy.get('[type="datetime-local"]').invoke('val', '2016-01-01T05:05').type('1959-09-13')
        })
      })

      describe('input[type=month]', () => {
        it('can change values', () => {
          cy.get('#month-without-value').type('1959-09').then(($text) => {
            expect($text).to.have.value('1959-09')
          })
        })

        it('overwrites existing value', () => {
          cy.get('#month-with-value').type('1959-09').then(($text) => {
            expect($text).to.have.value('1959-09')
          })
        })

        it('overwrites existing value input by invoking val', () => {
          cy.get('#month-without-value').invoke('val', '2016-01').type('1959-09').then(($text) => {
            expect($text).to.have.value('1959-09')
          })
        })
      })

      describe('input[type=week]', () => {
        it('can change values', () => {
          cy.get('#week-without-value').type('1959-W09').then(($text) => {
            expect($text).to.have.value('1959-W09')
          })
        })

        it('overwrites existing value', () => {
          cy.get('#week-with-value').type('1959-W09').then(($text) => {
            expect($text).to.have.value('1959-W09')
          })
        })

        it('overwrites existing value input by invoking val', () => {
          cy.get('#week-without-value').invoke('val', '2016-W01').type('1959-W09').then(($text) => {
            expect($text).to.have.value('1959-W09')
          })
        })
      })

      describe('input[type=time]', () => {
        it('can change values', () => {
          cy.get('#time-without-value').type('01:23:45').then(($text) => {
            expect($text).to.have.value('01:23:45')
          })
        })

        it('overwrites existing value', () => {
          cy.get('#time-with-value').type('12:34:56').then(($text) => {
            expect($text).to.have.value('12:34:56')
          })
        })

        it('overwrites existing value input by invoking val', () => {
          cy.get('#time-without-value').invoke('val', '01:23:45').type('12:34:56').then(($text) => {
            expect($text).to.have.value('12:34:56')
          })
        })

        it('can be formatted HH:mm', () => {
          cy.get('#time-without-value').type('01:23').then(($text) => {
            expect($text).to.have.value('01:23')
          })
        })

        it('can be formatted HH:mm:ss', () => {
          cy.get('#time-without-value').type('01:23:45').then(($text) => {
            expect($text).to.have.value('01:23:45')
          })
        })

        it('can be formatted HH:mm:ss.S', () => {
          cy.get('#time-without-value').type('01:23:45.9').then(($text) => {
            expect($text).to.have.value('01:23:45.9')
          })
        })

        it('can be formatted HH:mm:ss.SS', () => {
          cy.get('#time-without-value').type('01:23:45.99').then(($text) => {
            expect($text).to.have.value('01:23:45.99')
          })
        })

        it('can be formatted HH:mm:ss.SSS', () => {
          cy.get('#time-without-value').type('01:23:45.999').then(($text) => {
            expect($text).to.have.value('01:23:45.999')
          })
        })
      })

      describe('[contenteditable]', () => {
        it('can change values', () => {
          cy.get('#input-types [contenteditable]').type('foo').then(($div) => {
            expect($div).to.have.text('foo')
          })
        })

        it('inserts text after existing text', () => {
          cy.get('#input-types [contenteditable]').invoke('text', 'foo').type(' bar').then(($text) => {
            expect($text).to.have.text('foo bar')
          })
        })

        it('inserts text with only one input event', () => {
          const onInput = cy.stub()
          const onTextInput = cy.stub()

          cy.get('#input-types [contenteditable]')

          .invoke('text', 'foo')
          .then(($el) => $el.on('input', onInput))
          .then(($el) => $el.on('input', onTextInput))
          .type('\n').then(($text) => {
            expect(trimInnerText($text)).eq('foo')
          })
          .then(() => expect(onInput).to.be.calledOnce)
          .then(() => expect(onTextInput).to.be.calledOnce)
        })

        it('can type into [contenteditable] with existing <div>', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>foo</div>'

          cy.get('[contenteditable]:first')
          .type('bar').then(($div) => {
            expect(trimInnerText($div)).to.eql('foobar')
            expect($div.get(0).textContent).to.eql('foobar')

            expect($div.get(0).innerHTML).to.eql('<div>foobar</div>')
          })
        })

        it('can type into [contenteditable] with existing <p>', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<p>foo</p>'

          cy.get('[contenteditable]:first')
          .type('bar').then(($div) => {
            expect(trimInnerText($div)).to.eql('foobar')
            expect($div.get(0).textContent).to.eql('foobar')

            expect($div.get(0).innerHTML).to.eql('<p>foobar</p>')
          })
        })

        it('collapses selection to start on {leftarrow}', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>'

          cy.get('[contenteditable]:first')
          .type('{selectall}{leftarrow}foo').then(($div) => {
            expect(trimInnerText($div)).to.eql('foobar')
          })
        })

        it('collapses selection to end on {rightarrow}', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>'

          cy.get('[contenteditable]:first')
          .type('{selectall}{leftarrow}foo{selectall}{rightarrow}baz').then(($div) => {
            expect(trimInnerText($div)).to.eql('foobarbaz')
          })
        })

        // https://github.com/cypress-io/cypress/issues/5622
        it('collapses selection to end on {rightarrow} with modifiers', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>'

          cy.get('[contenteditable]:first')
          .type('{selectall}foo{selectall}{ctrl}Hello{selectall}{rightarrow} world').then(($div) => {
            expect(trimInnerText($div)).to.eql('Hello world')
          })
        })

        it('can remove a placeholder <br>', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div><br></div>'

          cy.get('[contenteditable]:first')
          .type('foobar').then(($div) => {
            expect($div.get(0).innerHTML).to.eql('<div>foobar</div>')
          })
        })

        it(`can type into an iframe with designmode = 'on'`, () => {
          // append a new iframe to the body
          cy.$$('<iframe id="generic-iframe" src="/fixtures/generic.html" style="height: 500px"></iframe>')
          .appendTo(cy.$$('body'))

          // wait for iframe to load
          let loaded = false

          cy.get('#generic-iframe')
          .then(($iframe) => {
            $iframe.on('load', () => {
              loaded = true
            })
          }).scrollIntoView()
          .should(() => {
            expect(loaded).to.eq(true)
          })

          // type text into iframe
          cy.get('#generic-iframe')
          .then(($iframe) => {
            $iframe[0].contentDocument.designMode = 'on'
            const iframe = $iframe.contents()

            cy.wrap(iframe.find('html')).first()
            .type('{selectall}{del} foo bar baz{enter}ac{leftarrow}b')
          })

          // assert that text was typed
          cy.get('#generic-iframe')
          .then(($iframe) => {
            const iframeText = $iframe[0].contentDocument.body.innerText

            expect(iframeText).to.include('foo bar baz\nabc')
          })
        })
      })

      // type follows focus
      // https://github.com/cypress-io/cypress/issues/2240
      describe('element reference loss', () => {
        it('follows the focus of the cursor', () => {
          cy.$$('input:first').keydown(_.after(4, () => {
            cy.$$('input').eq(1).focus()
          }))

          cy.get('input:first').type('foobar').then(() => {
            cy.get('input:first').should('have.value', 'foo')

            cy.get('input').eq(1).should('have.value', 'bar')
          })
        })

        it('follows focus into date input', () => {
          cy.$$('input:first').on('input', _.after(3, _.once((e) => {
            cy.$$('input[type=date]:first').focus()
          })))

          cy.get('input:first')
          .type('foo2010-10-10')
          .should('have.value', 'foo')

          cy.get('input[type=date]:first').should('have.value', '2010-10-10')
        })

        it('validates input after following focus change', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).contain('fooBAR')
            expect(err.message).contain('requires a valid date')
            done()
          })

          cy.$$('input:first').on('input', _.after(3, (e) => {
            cy.$$('input[type=date]:first').focus()
          }))

          cy.get('input:first')
          .type('fooBAR')
        })
      })
    })

    describe('specialChars', () => {
      context('parseSpecialCharSequences: false', () => {
        it('types special character sequences literally', (done) => {
          cy.get(':text:first').invoke('val', 'foo')
          .type('{{}{backspace}', { parseSpecialCharSequences: false }).then(($input) => {
            expect($input).to.have.value('foo{{}{backspace}')

            done()
          })
        })
      })

      context('{{}', () => {
        it('sets which and keyCode to 219', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(219)
            expect(e.keyCode).to.eq(219)

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{{}')
        })

        it('fires keypress event with 123 charCode', (done) => {
          cy.$$(':text:first').on('keypress', (e) => {
            expect(e.charCode).to.eq(123)
            expect(e.which).to.eq(123)
            expect(e.keyCode).to.eq(123)

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{{}')
        })

        it('fires textInput event with e.data', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            expect(e.originalEvent.data).to.eq('{')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{{}')
        })

        it('fires input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{{}')
        })

        it('can prevent default character insertion', () => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 219) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('{{}').then(($input) => {
            expect($input).to.have.value('foo')
          })
        })
      })

      context('{esc}', () => {
        it('sets which and keyCode to 27 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(27)
            expect(e.keyCode).to.eq(27)
            expect(e.key).to.eq('Escape')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{esc}')
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{esc}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{esc}').then(() => {
            done()
          })
        })

        it('can prevent default esc movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 27) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('d{esc}').then(($input) => {
            expect($input).to.have.value('food')

            done()
          })
        })
      })

      context('{backspace}', () => {
        it('backspaces character to the left', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{leftarrow}{backspace}u').then(($input) => {
            expect($input).to.have.value('bur')
          })
        })

        it('can delete all with {selectall}{backspace} in non-selectionrange element', () => {
          cy.get('input[type=email]:first')
          .should(($el) => $el.val('sdfsdf'))
          .type('{selectall}{backspace}')
          .should('have.value', '')
        })

        it('can backspace a selection range of characters', () => {
          // select the 'ar' characters
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(1, 3)
          }).get(':text:first').type('{backspace}').then(($input) => {
            expect($input).to.have.value('b')
          })
        })

        it('sets which and keyCode to 8 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', _.after(2, (e) => {
            expect(e.which).to.eq(8)
            expect(e.keyCode).to.eq(8)
            expect(e.key).to.eq('Backspace')

            done()
          }))

          cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}{backspace}')
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{backspace}').then(() => {
            done()
          })
        })

        it('can prevent default backspace movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 8) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('{leftarrow}{backspace}').then(($input) => {
            expect($input).to.have.value('foo')

            done()
          })
        })
      })

      context('{del}', () => {
        it('deletes character to the right', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{leftarrow}{del}').then(($input) => {
            expect($input).to.have.value('ba')
          })
        })

        it('can delete a selection range of characters', () => {
          // select the 'ar' characters
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(1, 3)
          }).get(':text:first').type('{del}').then(($input) => {
            expect($input).to.have.value('b')
          })
        })

        it('sets which and keyCode to 46 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', _.after(2, (e) => {
            expect(e.which).to.eq(46)
            expect(e.keyCode).to.eq(46)
            expect(e.key).to.eq('Delete')

            done()
          }))

          cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}{del}')
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{del}').then(() => {
            done()
          })
        })

        it('{del} does fire input event when value changes', () => {
          const onInput = cy.stub()

          cy.$$(':text:first').on('input', onInput)

          // select the 'a' characters
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(0, 1)
          }).get(':text:first').type('{del}')
          .then(() => expect(onInput).to.be.calledOnce)
        })

        it('does not fire input event when value does not change', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('should not have fired input')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{del}').then(() => {
            done()
          })
        })

        it('can prevent default del movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 46) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('{leftarrow}{del}').then(($input) => {
            expect($input).to.have.value('foo')

            done()
          })
        })
      })

      context('{leftarrow}', () => {
        it('can move the cursor from the end to end - 1', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{leftarrow}n').then(($input) => {
            expect($input).to.have.value('banr')
          })
        })

        it('does not move the cursor if already at bounds 0', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{selectall}{leftarrow}n').then(($input) => {
            expect($input).to.have.value('nbar')
          })
        })

        it('sets the cursor to the left bounds', () => {
          // select the 'a' character
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(1, 2)
          }).get(':text:first').type('{leftarrow}n').then(($input) => {
            expect($input).to.have.value('bnar')
          })
        })

        it('sets the cursor to the very beginning', () => {
          // select the 'a' character
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(0, 1)
          }).get(':text:first').type('{leftarrow}n').then(($input) => {
            expect($input).to.have.value('nbar')
          })
        })

        it('sets which and keyCode to 37 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(37)
            expect(e.keyCode).to.eq(37)
            expect(e.key).to.eq('ArrowLeft')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}').then(($input) => {
            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}').then(() => {
            done()
          })
        })

        it('can prevent default left arrow movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 37) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('{leftarrow}d').then(($input) => {
            expect($input).to.have.value('food')

            done()
          })
        })
      })

      context('{rightarrow}', () => {
        it('can move the cursor from the beginning to beginning + 1', () => {
          // select the beginning
          cy.get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(0, 0)
          }).get(':text:first').type('{rightarrow}n').then(($input) => {
            expect($input).to.have.value('bnar')
          })
        })

        it('does not move the cursor if already at end of bounds', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{selectall}{rightarrow}n').then(($input) => {
            expect($input).to.have.value('barn')
          })
        })

        it('sets the cursor to the rights bounds', () => {
          // select the 'a' character
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            $input.get(0).setSelectionRange(1, 2)
          }).get(':text:first').type('{rightarrow}n').then(($input) => {
            expect($input).to.have.value('banr')
          })
        })

        it('sets the cursor to the very beginning', () => {
          cy
          .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
            return $input.select()
          }).get(':text:first').type('{leftarrow}n').then(($input) => {
            expect($input).to.have.value('nbar')
          })
        })

        it('sets which and keyCode to 39 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(39)
            expect(e.keyCode).to.eq(39)
            expect(e.key).to.eq('ArrowRight')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{rightarrow}').then(($input) => {
            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{rightarrow}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{rightarrow}').then(() => {
            done()
          })
        })

        it('can prevent default right arrow movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 39) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('{leftarrow}{rightarrow}d').then(($input) => {
            expect($input).to.have.value('fodo')

            done()
          })
        })
      })

      context('{home}', () => {
        it('sets which and keyCode to 36 and does not fire keypress events', (done) => {
          cy.$$('#comments').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$('#comments').on('keydown', (e) => {
            expect(e.which).to.eq(36)
            expect(e.keyCode).to.eq(36)
            expect(e.key).to.eq('Home')

            done()
          })

          cy.get('#comments').type('{home}').then(($input) => {
            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$('#comments').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get('#comments').type('{home}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$('#comments').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get('#comments').type('{home}').then(() => {
            done()
          })
        })

        it('can move the cursor to input start', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{home}n').then(($input) => {
            expect($input).to.have.value('nbar')
          })
        })

        it('does not move the cursor if already at bounds 0', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{selectall}{leftarrow}{home}n').then(($input) => {
            expect($input).to.have.value('nbar')
          })
        })

        it('should move the cursor to the start of each line in textarea', () => {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz'

          cy.get('textarea:first')
          .type('{home}11{uparrow}{home}22{uparrow}{home}33').should('have.value', '33foo\n22bar\n11baz')
        })

        it('should move cursor to the start of each line in contenteditable', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML =
            '<div>foo</div>' +
            '<div>bar</div>' +
            '<div>baz</div>'

          cy.get('[contenteditable]:first')
          .type('{home}11{uparrow}{home}22{uparrow}{home}33').then(($div) => {
            expect(trimInnerText($div)).to.eql('33foo\n22bar\n11baz')
          })
        })
      })

      context('{end}', () => {
        it('sets which and keyCode to 35 and does not fire keypress events', (done) => {
          cy.$$('#comments').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$('#comments').on('keydown', (e) => {
            expect(e.which).to.eq(35)
            expect(e.keyCode).to.eq(35)
            expect(e.key).to.eq('End')

            done()
          })

          cy.get('#comments').type('{end}').then(($input) => {
            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$('#comments').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get('#comments').type('{end}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$('#comments').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get('#comments').type('{end}').then(() => {
            done()
          })
        })

        it('can move the cursor to input end', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{selectall}{leftarrow}{end}n').then(($input) => {
            expect($input).to.have.value('barn')
          })
        })

        it('does not move the cursor if already at end of bounds', () => {
          cy.get(':text:first').invoke('val', 'bar').type('{selectall}{rightarrow}{end}n').then(($input) => {
            expect($input).to.have.value('barn')
          })
        })

        it('should move the cursor to the end of each line in textarea', () => {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz'

          cy.get('textarea:first')
          .type('{end}11{uparrow}{end}22{uparrow}{end}33').should('have.value', 'foo33\nbar22\nbaz11')
        })

        it('should move cursor to the end of each line in contenteditable', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML =
            '<div>foo</div>' +
            '<div>bar</div>' +
            '<div>baz</div>'

          cy.get('[contenteditable]:first')
          .type('{end}11{uparrow}{end}22{uparrow}{end}33').then(($div) => {
            expect(trimInnerText($div)).to.eql('foo33\nbar22\nbaz11')
          })
        })
      })

      context('{uparrow}', () => {
        beforeEach(() => {
          cy.$$('#comments').val('foo\nbar\nbaz')
        })

        it('sets which and keyCode to 38 and does not fire keypress events', (done) => {
          cy.$$('#comments').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$('#comments').on('keydown', (e) => {
            expect(e.which).to.eq(38)
            expect(e.keyCode).to.eq(38)
            expect(e.key).to.eq('ArrowUp')

            done()
          })

          cy.get('#comments').type('{uparrow}').then(($input) => {
            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$('#comments').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get('#comments').type('{uparrow}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$('#comments').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get('#comments').type('{uparrow}').then(() => {
            done()
          })
        })

        it('up and down arrow on contenteditable', () => {
          cy.$$('[contenteditable]:first').get(0).innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>'

          cy.get('[contenteditable]:first')
          .type('{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33').then(($div) => {
            expect(trimInnerText($div)).to.eql('foo22\nb11ar\nbaz33')
          })
        })

        it('uparrow ignores current selection', () => {
          const ce = cy.$$('[contenteditable]:first').get(0)

          ce.innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>'

          // select 'bar'
          const line = cy.$$('[contenteditable]:first div:nth-child(1)').get(0)

          cy.document().then((doc) => {
            ce.focus()

            doc.getSelection().selectAllChildren(line)
          })

          cy.get('[contenteditable]:first')
          .type('{uparrow}11').then(($div) => {
            expect(trimInnerText($div)).to.eql('11foo\nbar\nbaz')
          })
        })

        it('up and down arrow on textarea', () => {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz'

          cy.get('textarea:first')
          .type('{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33').should('have.value', 'foo22\nb11ar\nbaz33')
        })

        it('increments input[type=number]', () => {
          cy.get('input[type="number"]:first')
          .invoke('val', '12.34')
          .type('{uparrow}{uparrow}')
          .should('have.value', '14')
        })
      })

      context('{downarrow}', () => {
        beforeEach(() => {
          cy.$$('#comments').val('foo\nbar\nbaz')
        })

        it('sets which and keyCode to 40 and does not fire keypress events', (done) => {
          cy.$$('#comments').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$('#comments').on('keydown', (e) => {
            expect(e.which).to.eq(40)
            expect(e.keyCode).to.eq(40)
            expect(e.key).to.eq('ArrowDown')

            done()
          })

          cy.get('#comments').type('{downarrow}').then(($input) => {
            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$('#comments').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get('#comments').type('{downarrow}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$('#comments').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get('#comments').type('{downarrow}').then(() => {
            done()
          })
        })

        it('{downarrow} will move to EOL on textarea', () => {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz'

          cy.get('textarea:first')
          .type('{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33{leftarrow}{downarrow}44').should('have.value', 'foo22\nb11ar\nbaz3344')
        })

        it('decrements input[type=\'number\']', () => {
          cy.get('input[type="number"]:first')
          .invoke('val', '12.34')
          .type('{downarrow}{downarrow}')
          .should('have.value', '11')
        })

        it('downarrow ignores current selection', () => {
          const ce = cy.$$('[contenteditable]:first').get(0)

          ce.innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>'

          // select 'foo'
          const line = cy.$$('[contenteditable]:first div:first').get(0)

          cy.document().then((doc) => {
            ce.focus()

            doc.getSelection().selectAllChildren(line)
          })

          cy.get('[contenteditable]:first')
          .type('{downarrow}22').then(($div) => {
            expect(trimInnerText($div)).to.eql('foo\n22bar\nbaz')
          })
        })
      })

      context('{selectall}{del}', () => {
        it('can select all the text and delete', () => {
          cy.get(':text:first').invoke('val', '1234').type('{selectall}{del}').type('foo').then(($text) => {
            expect($text).to.have.value('foo')
          })
        })

        it('can select all [contenteditable] and delete', () => {
          cy.get('#input-types [contenteditable]').invoke('text', '1234').type('{selectall}{del}').type('foo').then(($div) => {
            expect($div).to.have.text('foo')
          })
        })
      })

      context('{selectall} then type something', () => {
        it('replaces the text', () => {
          cy.get('#input-with-value').type('{selectall}new').then(($text) => {
            expect($text).to.have.value('new')
          })
        })
      })

      context('{enter}', () => {
        it('sets which and keyCode to 13 and prevents EOL insertion', (done) => {
          cy.$$('#input-types textarea').on('keypress', _.after(2, (e) => {
            done('should not have received keypress event')
          }))

          cy.$$('#input-types textarea').on('keydown', _.after(2, (e) => {
            expect(e.which).to.eq(13)
            expect(e.keyCode).to.eq(13)
            expect(e.key).to.eq('Enter')

            e.preventDefault()
          }))

          cy.get('#input-types textarea').invoke('val', 'foo').type('d{enter}').then(($textarea) => {
            expect($textarea).to.have.value('food')

            done()
          })
        })

        it('sets which and keyCode and charCode to 13 and prevents EOL insertion', (done) => {
          cy.$$('#input-types textarea').on('keypress', _.after(2, (e) => {
            expect(e.which).to.eq(13)
            expect(e.keyCode).to.eq(13)
            expect(e.charCode).to.eq(13)
            expect(e.key).to.eq('Enter')

            e.preventDefault()
          }))

          cy.get('#input-types textarea').invoke('val', 'foo').type('d{enter}').then(($textarea) => {
            expect($textarea).to.have.value('food')

            done()
          })
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{enter}').then(() => {
            done()
          })
        })

        it('does not fire input event when no text inserted', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{enter}').then(() => {
            done()
          })
        })

        // https://github.com/cypress-io/cypress/issues/3405
        it('does fire input event when text inserted', (done) => {
          cy.$$('[contenteditable]:first').on('input', (e) => {
            done()
          })

          cy.get('[contenteditable]:first').type('{enter}')
        })

        it('inserts new line into textarea', () => {
          cy.get('#input-types textarea').invoke('val', 'foo').type('bar{enter}baz{enter}quux').then(($textarea) => {
            expect($textarea).to.have.value('foobar\nbaz\nquux')
          })
        })

        it('inserts new line into [contenteditable] ', () => {
          cy.get('#input-types [contenteditable]:first').invoke('text', 'foo')
          .type('bar{enter}baz{enter}{enter}{enter}quux').then(function ($div) {
            const conditionalNewLines = '\n\n'.repeat(this.multiplierNumNewLines)

            expect(trimInnerText($div)).to.eql(`foobar\nbaz${conditionalNewLines}\nquux`)
            expect($div.get(0).textContent).to.eql('foobarbazquux')

            expect($div.get(0).innerHTML).to.eql('foobar<div>baz</div><div><br></div><div><br></div><div>quux</div>')
          })
        })

        it('inserts new line into [contenteditable] from midline', () => {
          cy.get('#input-types [contenteditable]:first').invoke('text', 'foo')
          .type('bar{leftarrow}{enter}baz{leftarrow}{enter}quux').then(($div) => {
            expect(trimInnerText($div)).to.eql('fooba\nba\nquuxzr')
            expect($div.get(0).textContent).to.eql('foobabaquuxzr')

            expect($div.get(0).innerHTML).to.eql('fooba<div>ba</div><div>quuxzr</div>')
          })
        })
      })

      context('{insert}', () => {
        it('sets which and keyCode to 45 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(45)
            expect(e.keyCode).to.eq(45)
            expect(e.key).to.eq('Insert')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{insert}')
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{insert}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{insert}').then(() => {
            done()
          })
        })

        it('can prevent default insert movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 45) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('d{insert}').then(($input) => {
            expect($input).to.have.value('food')

            done()
          })
        })
      })

      context('{pageup}', () => {
        it('sets which and keyCode to 33 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(33)
            expect(e.keyCode).to.eq(33)
            expect(e.key).to.eq('PageUp')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{pageup}')
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{pageup}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{pageup}').then(() => {
            done()
          })
        })

        it('can prevent default pageup movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 33) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('d{pageup}').then(($input) => {
            expect($input).to.have.value('food')

            done()
          })
        })
      })

      context('{pagedown}', () => {
        it('sets which and keyCode to 34 and does not fire keypress events', (done) => {
          cy.$$(':text:first').on('keypress', () => {
            done('should not have received keypress')
          })

          cy.$$(':text:first').on('keydown', (e) => {
            expect(e.which).to.eq(34)
            expect(e.keyCode).to.eq(34)
            expect(e.key).to.eq('PageDown')

            done()
          })

          cy.get(':text:first').invoke('val', 'ab').type('{pagedown}')
        })

        it('does not fire textInput event', (done) => {
          cy.$$(':text:first').on('textInput', (e) => {
            done('textInput should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{pagedown}').then(() => {
            done()
          })
        })

        it('does not fire input event', (done) => {
          cy.$$(':text:first').on('input', (e) => {
            done('input should not have fired')
          })

          cy.get(':text:first').invoke('val', 'ab').type('{pagedown}').then(() => {
            done()
          })
        })

        it('can prevent default pagedown movement', (done) => {
          cy.$$(':text:first').on('keydown', (e) => {
            if (e.keyCode === 34) {
              e.preventDefault()
            }
          })

          cy.get(':text:first').invoke('val', 'foo').type('d{pagedown}').then(($input) => {
            expect($input).to.have.value('food')

            done()
          })
        })
      })
    })

    describe('modifiers', () => {
      describe('activating modifiers', () => {
        it('sends keydown event for modifiers in order', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            return events.push(e)
          })

          cy.get('input:text:first').type('{shift}{ctrl}').then(() => {
            expect(events[0].shiftKey).to.be.true
            expect(events[0].which).to.equal(16)

            expect(events[1].ctrlKey).to.be.true
            expect(events[1].which).to.equal(17)

            $input.off('keydown')

            done()
          })
        })

        it('maintains modifiers for subsequent characters', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            return events.push(e)
          })

          cy.get('input:text:first').type('{command}{control}ok').then(() => {
            expect(events[2].metaKey).to.be.true
            expect(events[2].ctrlKey).to.be.true
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.true
            expect(events[3].ctrlKey).to.be.true
            expect(events[3].which).to.equal(75)

            $input.off('keydown')

            done()
          })
        })

        it('does not maintain modifiers for subsequent type commands', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            return events.push(e)
          })

          cy
          .get('input:text:first')
          .type('{command}{control}')
          .type('ok')
          .then(() => {
            expect(events[2].metaKey).to.be.false
            expect(events[2].ctrlKey).to.be.false
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.false
            expect(events[3].ctrlKey).to.be.false
            expect(events[3].which).to.equal(75)

            $input.off('keydown')

            done()
          })
        })

        // https://github.com/cypress-io/cypress/issues/5622
        it('still inserts text with non-shift modifiers', () => {
          cy.get('input:first').type('{ctrl}{meta}foobar')
          .should('have.value', 'foobar')
        })

        // https://github.com/cypress-io/cypress/issues/5622
        it('ignores duplicate modifiers in one command', () => {
          const events = []

          cy.$$('input:first').on('keydown', (e) => {
            events.push(['keydown', e.key])
          }).on('keyup', (e) => {
            events.push(['keyup', e.key])
          })

          cy.get('input:first')
          .type('{ctrl}{meta}a{control}b')
          .should('have.value', 'ab')
          .then(() => {
            expect(events).deep.eq([
              ['keydown', 'Control'],
              ['keydown', 'Meta'],
              ['keydown', 'a'],
              ['keyup', 'a'],
              ['keydown', 'b'],
              ['keyup', 'b'],
              ['keyup', 'Control'],
              ['keyup', 'Meta'],
            ])
          })
        })

        it('does not maintain modifiers for subsequent click commands', (done) => {
          const $button = cy.$$('button:first')
          let mouseDownEvent = null
          let mouseUpEvent = null
          let clickEvent = null

          $button.on('mousedown', (e) => {
            mouseDownEvent = e
          })

          $button.on('mouseup', (e) => {
            mouseUpEvent = e
          })

          $button.on('click', (e) => {
            clickEvent = e
          })

          cy
          .get('input:text:first')
          .type('{cmd}{option}')
          .get('button:first').click().then(() => {
            expect(mouseDownEvent.metaKey).to.be.false
            expect(mouseDownEvent.altKey).to.be.false

            expect(mouseUpEvent.metaKey).to.be.false
            expect(mouseUpEvent.altKey).to.be.false

            expect(clickEvent.metaKey).to.be.false
            expect(clickEvent.altKey).to.be.false

            $button.off('mousedown')
            $button.off('mouseup')
            $button.off('click')

            done()
          })
        })

        // https://github.com/cypress-io/cypress/issues/5439
        it('do not replace selection during modifier key', () => {
          cy
          .get('input:first').type('123')
          .then(($el) => {
            $el[0].setSelectionRange(0, 3)
          })
          .type('{ctrl}')
          .should('have.value', '123')
        })

        // sends keyboard events for modifiers https://github.com/cypress-io/cypress/issues/3316
        it('sends keyup event for activated modifiers when typing is finished', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keyup', (e) => {
            return events.push(e)
          })

          cy
          .get('input:text:first')
          .type('{alt}{ctrl}{meta}{shift}ok')
          .then(() => {
            // first keyups should be for the chars typed, "ok"
            expect(events[0].which).to.equal(79)
            expect(events[1].which).to.equal(75)

            expect(events[2].which).to.equal(18)
            expect(events[3].which).to.equal(17)
            expect(events[4].which).to.equal(91)
            expect(events[5].which).to.equal(16)

            $input.off('keyup')

            done()
          })
        })
      })

      describe('release: false', () => {
        it('maintains modifiers for subsequent type commands', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            return events.push(e)
          })

          cy
          .get('input:text:first')
          .type('{command}{control}', { release: false })
          .type('ok')
          .then(() => {
            expect(events[2].metaKey).to.be.true
            expect(events[2].ctrlKey).to.be.true
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.true
            expect(events[3].ctrlKey).to.be.true
            expect(events[3].which).to.equal(75)

            done()
          })
        })

        it('maintains modifiers for subsequent click commands', (done) => {
          const $button = cy.$$('button:first')
          let mouseDownEvent = null
          let mouseUpEvent = null
          let clickEvent = null

          $button.on('mousedown', (e) => {
            mouseDownEvent = e
          })

          $button.on('mouseup', (e) => {
            mouseUpEvent = e
          })

          $button.on('click', (e) => {
            clickEvent = e
          })

          cy
          .get('input:text:first')
          .type('{meta}{alt}', { release: false })
          .get('button:first').click().then(() => {
            expect(mouseDownEvent.metaKey).to.be.true
            expect(mouseDownEvent.altKey).to.be.true

            expect(mouseUpEvent.metaKey).to.be.true
            expect(mouseUpEvent.altKey).to.be.true

            expect(clickEvent.metaKey).to.be.true
            expect(clickEvent.altKey).to.be.true

            done()
          })
        })

        it('resets modifiers before next test', () => {
          // this test will fail if you comment out
          // keyboard.resetModifiers

          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keyup', (e) => {
            return events.push(e)
          })

          cy
          .get('input:text:first')
          .type('a', { release: false })
          .then(() => {
            expect(events[0].metaKey).to.be.false
            expect(events[0].ctrlKey).to.be.false

            expect(events[0].altKey).to.be.false
          })
        })
      })

      describe('changing modifiers', () => {
        beforeEach(function () {
          this.$input = cy.$$('input:text:first')

          cy.get('input:text:first').type('{command}{option}', { release: false })
        })

        afterEach(function () {
          this.$input.off('keydown')
        })

        it('sends keydown event for new modifiers', function () {
          const spy = cy.spy().as('keydown')

          this.$input.on('keydown', spy)

          cy.get('input:text:first').type('{shift}').then(() => {
            expect(spy).to.be.calledWithMatch({ which: 16 })
          })
        })

        it('does not send keydown event for already activated modifiers', function () {
          const spy = cy.spy().as('keydown')

          this.$input.on('keydown', spy)

          cy.get('input:text:first').type('{cmd}{alt}').then(() => {
            expect(spy).to.not.be.called
          })
        })
      })
    })

    describe('case-insensitivity', () => {
      it('special chars are case-insensitive', () => {
        cy.get(':text:first').invoke('val', 'bar').type('{leftarrow}{DeL}').then(($input) => {
          expect($input).to.have.value('ba')
        })
      })

      it('modifiers are case-insensitive', (done) => {
        const $input = cy.$$('input:text:first')
        let alt = false

        $input.on('keydown', (e) => {
          if (e.altKey) {
            alt = true
          }
        })

        cy.get('input:text:first').type('{aLt}').then(() => {
          expect(alt).to.be.true

          $input.off('keydown')

          done()
        })
      })

      it('letters are case-sensitive', () => {
        cy.get('input:text:first').type('FoO').then(($input) => {
          expect($input).to.have.value('FoO')
        })
      })

      it('{shift} does not capitalize characters', () => {
        cy.get('input:first').type('{shift}foo').should('have.value', 'foo')
      })
    })

    describe('click events', () => {
      it('passes timeout and interval down to click', (done) => {
        const input = $('<input />').attr('id', 'input-covered-in-span').prependTo(cy.$$('body'))

        $('<span>span on input</span>')
        .css({
          position: 'absolute',
          left: input.offset().left,
          top: input.offset().top,
          padding: 5,
          display: 'inline-block',
          backgroundColor: 'yellow',
        })
        .prependTo(cy.$$('body'))

        cy.on('command:retry', (options) => {
          expect(options.timeout).to.eq(1000)
          expect(options.interval).to.eq(60)

          done()
        })

        cy.get('#input-covered-in-span').type('foobar', { timeout: 1000, interval: 60 })
      })

      it('does not issue another click event between type/type', () => {
        const clicked = cy.stub()

        cy.$$(':text:first').click(clicked)

        cy.get(':text:first').type('f').type('o').then(() => {
          expect(clicked).to.be.calledOnce
        })
      })

      it('does not issue another click event if element is already in focus from click', () => {
        const clicked = cy.stub()

        cy.$$(':text:first').click(clicked)

        cy.get(':text:first').click().type('o').then(() => {
          expect(clicked).to.be.calledOnce
        })
      })
    })

    describe('change events', () => {
      it('fires when enter is pressed and value has changed', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').type('bar{enter}').then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('fires twice when enter is pressed and then again after losing focus', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').type('bar{enter}baz').blur().then(() => {
          expect(changed).to.be.calledTwice
        })
      })

      it('fires when element loses focus due to another action (click)', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy
        .get(':text:first').type('foo').then(() => {
          expect(changed).not.to.be.called
        })
        .get('button:first').click().then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('fires when element loses focus due to another action (type)', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy
        .get(':text:first').type('foo').then(() => {
          expect(changed).not.to.be.called
        })
        .get('textarea:first').type('bar').then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('fires when element is directly blurred', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy
        .get(':text:first').type('foo').blur().then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('fires when element is tabbed away from')//, ->
      //   changed = 0

      //   cy.$$(":text:first").change ->
      //     changed += 1

      //   cy.get(":text:first").invoke("val", "foo").type("b{tab}").then ->
      //     expect(changed).to.eq 1

      it('does not fire twice if element is already in focus between type/type', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').type('f').type('o{enter}').then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('does not fire twice if element is already in focus between clear/type', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').clear().type('o{enter}').then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('does not fire twice if element is already in focus between click/type', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').click().type('o{enter}').then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('does not fire twice if element is already in focus between type/click', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').type('d{enter}').click().then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('does not fire at all between clear/type/click', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').clear().type('o').click().then(($el) => {
          expect(changed).not.to.be.called

          return $el
        }).blur()
        .then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('does not fire if {enter} is preventedDefault', () => {
        const changed = cy.stub()

        cy.$$(':text:first').keypress((e) => {
          if (e.which === 13) {
            e.preventDefault()
          }
        })

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').type('b{enter}').then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire when enter is pressed and value hasnt changed', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.get(':text:first').invoke('val', 'foo').type('b{backspace}{enter}').then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire at the end of the type', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy
        .get(':text:first').type('foo').then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire change event if value hasnt actually changed', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy
        .get(':text:first').invoke('val', 'foo').type('{backspace}{backspace}oo{enter}').blur().then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire if mousedown is preventedDefault which prevents element from losing focus', () => {
        const changed = cy.stub()

        cy.$$(':text:first').change(changed)

        cy.$$('textarea:first').mousedown(() => {
          return false
        })

        cy
        .get(':text:first').invoke('val', 'foo').type('bar')
        .get('textarea:first').click().then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire hitting {enter} inside of a textarea', () => {
        const changed = cy.stub()

        cy.$$('textarea:first').change(changed)

        cy
        .get('textarea:first').type('foo{enter}bar').then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire hitting {enter} inside of [contenteditable]', () => {
        const changed = cy.stub()

        cy.$$('[contenteditable]:first').change(changed)

        cy
        .get('[contenteditable]:first').type('foo{enter}bar').then(() => {
          expect(changed).not.to.be.called
        })
      })

      // [contenteditable] does not fire ANY change events ever.
      it('does not fire at ALL for [contenteditable]', () => {
        const changed = cy.stub()

        cy.$$('[contenteditable]:first').change(changed)

        cy
        .get('[contenteditable]:first').type('foo')
        .get('button:first').click().then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire on .clear() without blur', () => {
        const changed = cy.stub()

        cy.$$('input:first').change(changed)

        cy.get('input:first').invoke('val', 'foo')
        .clear()
        .then(($el) => {
          expect(changed).not.to.be.called

          return $el
        }).type('foo')
        .blur()
        .then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('fires change for single value change inputs', () => {
        const changed = cy.stub()

        cy.$$('input[type="date"]:first').change(changed)

        cy.get('input[type="date"]:first')
        .type('1959-09-13')
        .blur()
        .then(() => {
          expect(changed).to.be.calledOnce
        })
      })

      it('does not fire change for non-change single value input', () => {
        const changed = cy.stub()

        cy.$$('input[type="date"]:first').change(changed)

        cy.get('input[type="date"]:first')
        .invoke('val', '1959-09-13')
        .type('1959-09-13')
        .blur()
        .then(() => {
          expect(changed).not.to.be.called
        })
      })

      it('does not fire change for type\'d change that restores value', () => {
        const changed = cy.stub()

        cy.$$('input:first').change(changed)

        cy.get('input:first')
        .invoke('val', 'foo')
        .type('{backspace}o')
        .invoke('val', 'bar')
        .type('{backspace}r')
        .blur()
        .then(() => {
          expect(changed).not.to.be.called
        })
      })
    })

    describe('single value change inputs', () => {
      // https://github.com/cypress-io/cypress/issues/5476
      it('fires all keyboard events', () => {
        const els = {
          $date: cy.$$('input[type=date]:first'),
        }

        attachKeyListeners(els)

        cy.get('input[type=date]:first')
        .type('2019-12-10')

        cy.getAll('$date', keyEvents.join(' ')).each(shouldBeCalledWithCount(10))
      })
    })

    describe('caret position', () => {
      it('respects being formatted by input event handlers')

      it('accurately returns host contenteditable attr', () => {
        const hostEl = cy.$$('<div contenteditable><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns host contenteditable=true attr', () => {
        const hostEl = cy.$$('<div contenteditable="true"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns host contenteditable="" attr', () => {
        const hostEl = cy.$$('<div contenteditable=""><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns host contenteditable="foo" attr', () => {
        const hostEl = cy.$$('<div contenteditable="foo"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns document body el with no falsey contenteditable="false" attr', () => {
        cy.$$('<div contenteditable="false"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq($el[0].ownerDocument.body)
        })
      })

      // https://github.com/cypress-io/cypress/issues/3001
      describe('skip actionability if already focused', () => {
        it('inside input', () => {
          cy.$$('body').append(Cypress.$(/*html*/`\
<div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div> \
<input type="text" id="foo">\
`))

          cy.$$('#foo').focus()

          cy.focused().type('new text').should('have.prop', 'value', 'new text')
        })

        it('inside textarea', () => {
          cy.$$('body').append(Cypress.$(/*html*/`\
<div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div> \
<textarea id="foo"></textarea>\
`))

          cy.$$('#foo').focus()

          cy.focused().type('new text').should('have.prop', 'value', 'new text')
        })

        it('inside contenteditable', () => {
          cy.$$('body').append(Cypress.$(/*html*/`\
<div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div> \
<div id="foo" contenteditable> \
<div>foo</div><div>bar</div><div>baz</div> \
</div>\
`))

          const win = cy.state('window')
          const doc = window.document

          cy.$$('#foo').focus()
          const inner = cy.$$('div:contains(bar):last')

          const range = doc.createRange()

          range.selectNodeContents(inner[0])
          const sel = win.getSelection()

          sel.removeAllRanges()

          sel.addRange(range)

          cy.get('div:contains(bar):last').type('new text').should('have.prop', 'innerText', 'new text')
        })
      })

      it('can arrow from maxlength', () => {
        cy.get('input:first').invoke('attr', 'maxlength', '5').type('foobar{leftarrow}')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({ start: 4, end: 4 })
        })
      })

      it('won\'t arrowright past length', () => {
        cy.get('input:first').type('foo{rightarrow}{rightarrow}{rightarrow}bar{rightarrow}')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('won\'t arrowleft before word', () => {
        cy.get('input:first').type(`oo{leftarrow}{leftarrow}{leftarrow}f${'{leftarrow}'.repeat(5)}`)

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({ start: 0, end: 0 })
        })
      })

      it('leaves caret at the end of contenteditable', () => {
        cy.get('[contenteditable]:first').type('foobar')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('leaves caret at the end of contenteditable when prefilled', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = 'foo'
        cy.get('[contenteditable]:first').type('bar')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('can move the caret left on contenteditable', () => {
        cy.get('[contenteditable]:first').type('foo{leftarrow}{leftarrow}')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({ start: 1, end: 1 })
        })
      })

      //make sure caret is correct
      // type left left
      // make sure caret correct
      // text is fboo
      // fix input-mask issue

      it('leaves caret at the end of input', () => {
        cy.get(':text:first').type('foobar')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$(':text:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('leaves caret at the end of textarea', () => {
        cy.get('#comments').type('foobar')

        cy.window().then((win) => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('#comments').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('can wrap cursor to next line in [contenteditable] with {rightarrow}', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = 'start' +
        '<div>middle</div>' +
        '<div>end</div>'

        cy.get('[contenteditable]:first')
        // move cursor to beginning of div
        .type('{selectall}{leftarrow}')
        .type(`${'{rightarrow}'.repeat(14)}[_I_]`).then(($el) => {
          expect(trimInnerText($el)).to.eql('start\nmiddle\ne[_I_]nd')
        })
      })

      it('can wrap cursor to prev line in [contenteditable] with {leftarrow}', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = 'start' +
        '<div>middle</div>' +
        '<div>end</div>'

        cy.get('[contenteditable]:first').type(`${'{leftarrow}'.repeat(12)}[_I_]`).then(($el) => {
          expect(trimInnerText($el)).to.eql('star[_I_]t\nmiddle\nend')
        })
      })

      it('can wrap cursor to next line in [contenteditable] with {rightarrow} and empty lines', function () {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = `${'<div><br></div>'.repeat(4)}<div>end</div>`

        const newLines = '\n\n\n'.repeat(this.multiplierNumNewLines)

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type(`foobar${'{rightarrow}'.repeat(6)}[_I_]`).then(() => {
          expect(trimInnerText($el)).to.eql(`foobar${newLines}\nen[_I_]d`)
        })
      })

      it('can use {rightarrow} and nested elements', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = '<div><b>s</b>ta<b>rt</b></div>'

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type(`${'{rightarrow}'.repeat(3)}[_I_]`).then(() => {
          expect(trimInnerText($el)).to.eql('sta[_I_]rt')
        })
      })

      it('enter and \\n should act the same for [contenteditable]', () => {
        // non breaking white space
        const cleanseText = (text) => {
          return text.split('\u00a0').join(' ')
        }

        const expectMatchInnerText = ($el, innerText) => {
          expect(cleanseText(trimInnerText($el))).to.eql(innerText)
        }

        // NOTE: this may only pass in Chrome since the whitespace may be different in other browsers
        //  even if actual and expected appear the same.
        const expected = '{\n  foo:   1\n  bar:   2\n  baz:   3\n}'

        cy.get('[contenteditable]:first')
        .invoke('html', '<div><br></div>')
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should(($el) => {
          expectMatchInnerText($el, expected)
        })
        .clear()
        .blur()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should(($el) => {
          expectMatchInnerText($el, expected)
        })
      })

      it('enter and \\n should act the same for textarea', () => {
        const expected = '{\n  foo:   1\n  bar:   2\n  baz:   3\n}'

        cy.get('textarea:first')
        .clear()
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should('have.prop', 'value', expected)
        .clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should('have.prop', 'value', expected)
      })
    })

    describe('{enter}', () => {
      beforeEach(function () {
        this.$forms = cy.$$('#form-submits')
      })

      context('1 input, no \'submit\' elements', () => {
        it('triggers form submit', function (done) {
          this.foo = {}

          this.$forms.find('#single-input').submit((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#single-input input').type('foo{enter}')
        })

        it('triggers form submit synchronously before type logs or resolves', function () {
          const events = []

          cy.on('command:start', (cmd) => {
            return events.push(`${cmd.get('name')}:start`)
          })

          this.$forms.find('#single-input').submit((e) => {
            e.preventDefault()

            events.push('submit')
          })

          cy.on('log:added', (attrs, log) => {
            const state = log.get('state')

            if (state === 'pending') {
              log.on('state:changed', (state) => {
                return events.push(`${log.get('name')}:log:${state}`)
              })

              events.push(`${log.get('name')}:log:${state}`)
            }
          })

          cy.on('command:end', (cmd) => {
            return events.push(`${cmd.get('name')}:end`)
          })

          cy.get('#single-input input').type('f{enter}').then(() => {
            expect(events).to.deep.eq([
              'get:start', 'get:log:pending', 'get:end', 'type:start', 'type:log:pending', 'submit', 'type:end', 'then:start',
            ])
          })
        })

        it('triggers 2 form submit event', function () {
          const submitted = cy.stub()

          this.$forms.find('#single-input').submit((e) => {
            e.preventDefault()

            submitted()
          })

          cy.get('#single-input input').type('f{enter}{enter}').then(() => {
            expect(submitted).to.be.calledTwice
          })
        })

        it('does not submit when keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#single-input').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keydown((e) => {
            e.preventDefault()
          })

          cy.get('#single-input input').type('f').type('f{enter}').then(() => {
            done()
          })
        })

        it('does not submit when keydown is defaultPrevented on wrapper', function (done) {
          const form = this.$forms.find('#single-input').submit(() => {
            done('err: should not have submitted')
          })

          form.find('div').keydown((e) => {
            e.preventDefault()
          })

          cy.get('#single-input input').type('f').type('f{enter}').then(() => {
            done()
          })
        })

        it('does not submit when keydown is defaultPrevented on form', function (done) {
          const form = this.$forms.find('#single-input').submit(() => {
            done('err: should not have submitted')
          })

          form.keydown((e) => {
            e.preventDefault()
          })

          cy.get('#single-input input').type('f').type('f{enter}').then(() => {
            done()
          })
        })

        it('does not submit when keypress is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#single-input').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#single-input input').type('f').type('f{enter}').then(() => {
            done()
          })
        })

        it('does not submit when keypress is defaultPrevented on wrapper', function (done) {
          const form = this.$forms.find('#single-input').submit(() => {
            done('err: should not have submitted')
          })

          form.find('div').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#single-input input').type('f').type('f{enter}').then(() => {
            done()
          })
        })

        it('does not submit when keypress is defaultPrevented on form', function (done) {
          const form = this.$forms.find('#single-input').submit(() => {
            done('err: should not have submitted')
          })

          form.keypress((e) => {
            e.preventDefault()
          })

          cy.get('#single-input input').type('f').type('f{enter}').then(() => {
            done()
          })
        })
      })

      // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
      context('2 inputs, no \'submit\' elements, no inputs allowing implicit submission', () => {
        it('does not trigger submit event', function (done) {
          this.$forms.find('#no-buttons-more-than-one-input-allowing-implicit-submission').submit(() => {
            done('err: should not have submitted')
          })

          cy.get('#no-buttons-more-than-one-input-allowing-implicit-submission input:first').type('f').type('{enter}').then(() => {
            done()
          })
        })
      })

      context('2 inputs, no \'submit\' elements, only 1 input allowing implicit submission', () => {
        it('does submit event', function () {
          const submit = cy.stub().as('submit')

          this.$forms.find('#no-buttons-and-only-one-input-allowing-implicit-submission').submit((e) => {
            e.preventDefault()
            submit()
          })

          cy.get('#no-buttons-and-only-one-input-allowing-implicit-submission input:first').type('f{enter}')
          cy.then(() => {
            expect(submit).to.be.calledOnce
          })
        })
      })

      context('2 inputs, no \'submit\' elements but 1 button[type=button]', () => {
        it('does not trigger submit event', function (done) {
          this.$forms.find('#one-button-type-button').submit(() => {
            done('err: should not have submitted')
          })

          cy.get('#one-button-type-button input:first').type('f').type('{enter}').then(() => {
            done()
          })
        })
      })

      context('2 inputs, 1 \'submit\' element input[type=submit]', () => {
        it('triggers form submit', function (done) {
          this.$forms.find('#multiple-inputs-and-input-submit').submit((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-input-submit input:first').type('foo{enter}')
        })

        it('causes click event on the input[type=submit]', function (done) {
          this.$forms.find('#multiple-inputs-and-input-submit input[type=submit]').click((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-input-submit input:first').type('foo{enter}')
        })

        it('does not cause click event on the input[type=submit] if keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#multiple-inputs-and-input-submit').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#multiple-inputs-and-input-submit input:first').type('f{enter}').then(() => {
            done()
          })
        })
      })

      context('2 inputs, 1 \'submit\' element button[type=submit]', () => {
        it('triggers form submit', function (done) {
          this.$forms.find('#multiple-inputs-and-button-submit').submit((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-button-submit input:first').type('foo{enter}')
        })

        it('causes click event on the button[type=submit]', function (done) {
          this.$forms.find('#multiple-inputs-and-button-submit button[type=submit]').click((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-button-submit input:first').type('foo{enter}')
        })

        it('does not cause click event on the button[type=submit] if keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#multiple-inputs-and-button-submit').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#multiple-inputs-and-button-submit input:first').type('f{enter}').then(() => {
            done()
          })
        })
      })

      context(`2 inputs, 1 'submit' button[type=submit], 1 'reset' button[type=reset]`, () => {
        it('triggers form submit', function () {
          const submit = cy.stub()

          this.$forms.find('#multiple-inputs-and-reset-and-submit-buttons').submit((e) => {
            e.preventDefault()
            submit()
          })

          cy.get('#multiple-inputs-and-reset-and-submit-buttons input:first')
          .type('foo{enter}')

          cy.then(() => {
            expect(submit).to.be.calledOnce
          })
        })

        it('causes click event on the button[type=submit]', function (done) {
          this.$forms.find('#multiple-inputs-and-reset-and-submit-buttons button[type=submit]').click((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-reset-and-submit-buttons input:first').type('foo{enter}')
        })

        it('does not cause click event on the button[type=submit] if keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#multiple-inputs-and-reset-and-submit-buttons').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#multiple-inputs-and-reset-and-submit-buttons input:first').type('f{enter}').then(() => {
            done()
          })
        })
      })

      context('2 inputs, 1 \'reset\' button, 1 \'button\' button, and 1 button with no type (default submit)', () => {
        it('triggers form submit', function (done) {
          this.$forms.find('#multiple-inputs-and-other-type-buttons-and-button-with-no-type').submit((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-other-type-buttons-and-button-with-no-type input:first').type('foo{enter}')
        })

        it('causes click event on the button', function (done) {
          this.$forms.find('#multiple-inputs-and-other-type-buttons-and-button-with-no-type button:last').click((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-other-type-buttons-and-button-with-no-type input:first').type('foo{enter}')
        })

        it('does not cause click event on the button if keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#multiple-inputs-and-other-type-buttons-and-button-with-no-type').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#multiple-inputs-and-other-type-buttons-and-button-with-no-type input:first').type('f{enter}').then(() => {
            done()
          })
        })
      })

      context('2 inputs, 1 \'submit\' element button', () => {
        it('triggers form submit', function (done) {
          this.$forms.find('#multiple-inputs-and-button-with-no-type').submit((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-button-with-no-type input:first').type('foo{enter}')
        })

        it('causes click event on the button', function (done) {
          this.$forms.find('#multiple-inputs-and-button-with-no-type button').click((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-button-with-no-type input:first').type('foo{enter}')
        })

        it('does not cause click event on the button if keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#multiple-inputs-and-button-with-no-type').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#multiple-inputs-and-button-with-no-type input:first').type('f{enter}').then(() => {
            done()
          })
        })
      })

      context('2 inputs, 2 \'submit\' elements', () => {
        it('triggers form submit', function (done) {
          this.$forms.find('#multiple-inputs-and-multiple-submits').submit((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-multiple-submits input:first').type('foo{enter}')
        })

        it('causes click event on the button', function (done) {
          this.$forms.find('#multiple-inputs-and-multiple-submits button').click((e) => {
            e.preventDefault()

            done()
          })

          cy.get('#multiple-inputs-and-multiple-submits input:first').type('foo{enter}')
        })

        it('does not cause click event on the button if keydown is defaultPrevented on input', function (done) {
          const form = this.$forms.find('#multiple-inputs-and-multiple-submits').submit(() => {
            done('err: should not have submitted')
          })

          form.find('input').keypress((e) => {
            e.preventDefault()
          })

          cy.get('#multiple-inputs-and-multiple-submits input:first').type('f{enter}').then(() => {
            done()
          })
        })
      })

      context('disabled default button', () => {
        beforeEach(function () {
          this.$forms.find('#multiple-inputs-and-multiple-submits').find('button').prop('disabled', true)
        })

        it('will not receive click event', function (done) {
          this.$forms.find('#multiple-inputs-and-multiple-submits button').click(() => {
            done('err: should not receive click event')
          })

          cy.get('#multiple-inputs-and-multiple-submits input:first').type('foo{enter}').then(() => {
            done()
          })
        })

        it('will not submit the form', function (done) {
          this.$forms.find('#multiple-inputs-and-multiple-submits').submit(() => {
            done('err: should not receive submit event')
          })

          cy.get('#multiple-inputs-and-multiple-submits input:first').type('foo{enter}').then(() => {
            done()
          })
        })
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        null
      })

      it('eventually passes the assertion', () => {
        cy.$$('input:first').keyup(function () {
          _.delay(() => {
            $(this).addClass('typed')
          }
          , 100)
        })

        cy.get('input:first').type('f').should('have.class', 'typed').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        null
      })

      it('passes in $el', () => {
        cy.get('input:first').type('foobar').then(function ($input) {
          const { lastLog } = this

          expect(lastLog.get('$el')).to.eq($input)
        })
      })

      it('logs message', () => {
        cy.get(':text:first').type('foobar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foobar')
        })
      })

      it('logs delay arguments', () => {
        cy.get(':text:first').type('foo', { delay: 20 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo, {delay: 20}')
        })
      })

      it('clones textarea value after the type happens', () => {
        const expectToHaveValueAndCoords = () => {
          const cmd = cy.queue.find({ name: 'type' })
          const log = cmd.get('logs')[0]
          const txt = log.get('snapshots')[1].body.find('#comments')

          expect(txt).to.have.value('foobarbaz')

          expect(log.get('coords')).to.be.ok
        }

        cy
        .get('#comments').type('foobarbaz').then(($txt) => {
          expectToHaveValueAndCoords()
        }).get('#comments').clear().type('onetwothree').then(() => {
          expectToHaveValueAndCoords()
        })
      })

      it('clones textarea value when textarea is focused first', () => {
        const expectToHaveValueAndNoCoords = () => {
          const cmd = cy.queue.find({ name: 'type' })
          const log = cmd.get('logs')[0]
          const txt = log.get('snapshots')[1].body.find('#comments')

          expect(txt).to.have.value('foobarbaz')

          expect(log.get('coords')).not.to.be.ok
        }

        cy
        .get('#comments').focus().type('foobarbaz').then(($txt) => {
          expectToHaveValueAndNoCoords()
        }).get('#comments').clear().type('onetwothree').then(() => {
          expectToHaveValueAndNoCoords()
        })
      })

      it('logs only one type event', () => {
        const logs = []
        const types = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
          if (log.get('name') === 'type') {
            types.push(log)
          }
        })

        cy.get(':text:first').type('foo').then(() => {
          expect(logs.length).to.eq(2)

          expect(types.length).to.eq(1)
        })
      })

      it('logs immediately before resolving', () => {
        const $txt = cy.$$(':text:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'type') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($txt.get(0))
          }
        })

        cy.get(':text:first').type('foo').then(() => {})

        cy.get(':text:first').type('foo')
      })

      it('snapshots before typing', function () {
        let expected = false

        cy.$$(':text:first').one('keydown', () => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          expected = true
        })

        cy.get(':text:first').type('foo').then(() => {
          expect(expected).to.be.true
        })
      })

      it('snapshots after typing', () => {
        cy.get(':text:first').type('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')

          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('logs deltaOptions', () => {
        cy.get(':text:first').type('foo', { force: true, timeout: 1000 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo, {force: true, timeout: 1000}')

          expect(lastLog.invoke('consoleProps').Options).to.deep.eq({ force: true, timeout: 1000 })
        })
      })

      context('#consoleProps', () => {
        it('has all of the regular options', () => {
          cy.get('input:first').type('foobar').then(function ($input) {
            const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($input)
            const console = this.lastLog.invoke('consoleProps')

            expect(console.Command).to.eq('type')
            expect(console.Typed).to.eq('foobar')
            expect(console['Applied To']).to.eq($input.get(0))
            expect(console.Coords.x).to.be.closeTo(fromElWindow.x, 1)

            expect(console.Coords.y).to.be.closeTo(fromElWindow.y, 1)
          })
        })

        // Updated not to input text when non-shift modifier is pressed
        // https://github.com/cypress-io/cypress/issues/5424
        it('has a table of keys', () => {
          cy.get(':text:first').type('{cmd}{option}foo{enter}b{leftarrow}{del}{enter}')
          .then(function ($input) {
            const table = this.lastLog.invoke('consoleProps').table[2]()

            // eslint-disable-next-line
            console.table(table.data, table.columns)

            expect(table.name).to.eq('Keyboard Events')
            const expectedTable = {
              1: { 'Details': '{ code: MetaLeft, which: 91 }', Typed: '{cmd}', 'Events Fired': 'keydown', 'Active Modifiers': 'meta', 'Prevented Default': null, 'Target Element': $input[0] },
              2: { 'Details': '{ code: AltLeft, which: 18 }', Typed: '{option}', 'Events Fired': 'keydown', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              3: { 'Details': '{ code: KeyF, which: 70 }', Typed: 'f', 'Events Fired': 'keydown, keypress, textInput, input, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              4: { 'Details': '{ code: KeyO, which: 79 }', Typed: 'o', 'Events Fired': 'keydown, keypress, textInput, input, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              5: { 'Details': '{ code: KeyO, which: 79 }', Typed: 'o', 'Events Fired': 'keydown, keypress, textInput, input, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              6: { 'Details': '{ code: Enter, which: 13 }', Typed: '{enter}', 'Events Fired': 'keydown, keypress, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              7: { 'Details': '{ code: KeyB, which: 66 }', Typed: 'b', 'Events Fired': 'keydown, keypress, textInput, input, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              8: { 'Details': '{ code: ArrowLeft, which: 37 }', Typed: '{leftarrow}', 'Events Fired': 'keydown, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              9: { 'Details': '{ code: Delete, which: 46 }', Typed: '{del}', 'Events Fired': 'keydown, input, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              10: { 'Details': '{ code: Enter, which: 13 }', Typed: '{enter}', 'Events Fired': 'keydown, keypress, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
              11: { 'Details': '{ code: MetaLeft, which: 91 }', Typed: '{cmd}', 'Events Fired': 'keyup', 'Active Modifiers': 'alt', 'Prevented Default': null, 'Target Element': $input[0] },
              12: { 'Details': '{ code: AltLeft, which: 18 }', Typed: '{option}', 'Events Fired': 'keyup', 'Active Modifiers': null, 'Prevented Default': null, 'Target Element': $input[0] },
            }

            // uncomment for debugging
            // _.each(table.data, (v, i) => expect(v).containSubset(expectedTable[i]))
            expect(table.data).to.deep.eq(expectedTable)
            expect($input.val()).eq('foo')
          })
        })

        it('has no modifiers when there are none activated', () => {
          cy.get(':text:first').type('f').then(function ($el) {
            const table = this.lastLog.invoke('consoleProps').table[2]()

            expect(table.data).to.deep.eq({
              1: { Typed: 'f', 'Events Fired': 'keydown, keypress, textInput, input, keyup', 'Active Modifiers': null, Details: '{ code: KeyF, which: 70 }', 'Prevented Default': null, 'Target Element': $el[0] },
            })
          })
        })

        it('has a table of keys with preventedDefault', () => {
          cy.$$(':text:first').keydown(() => {
            return false
          })

          cy.get(':text:first').type('f').then(function ($el) {
            const table = this.lastLog.invoke('consoleProps').table[2]()

            // eslint-disable-next-line
            console.table(table.data, table.columns)

            expect(table.data).to.deep.eq({
              1: { Typed: 'f', 'Events Fired': 'keydown, keyup', 'Active Modifiers': null, Details: '{ code: KeyF, which: 70 }', 'Prevented Default': true, 'Target Element': $el[0] },
            })
          })
        })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.noop({}).type('foo')
      })

      it('throws when subject is not in the document', (done) => {
        const typed = cy.stub()

        const input = cy.$$('input:first').keypress((e) => {
          typed()

          input.remove()
        })

        cy.on('fail', (err) => {
          expect(typed).to.be.calledOnce
          expect(err.message).to.include('cy.type() failed because this element')

          done()
        })

        cy.get('input:first').type('a').type('b')
      })

      _.each([
        { id: 'readonly-attr', val: '' },
        { id: 'readonly-empty-str', val: '' },
        { id: 'readonly-readonly', val: 'readonly' },
        { id: 'readonly-str', val: 'abc' },
      ], (attrs) => {
        it(`throws when readonly ${attrs.val} attr (${attrs.id})`, (done) => {
          cy.get(`#${attrs.id}`).type('foo')

          cy.on('fail', (err) => {
            expect(err.message).to.include('cy.type() failed because this element is readonly:')
            expect(err.message).to.include(`<input id="${attrs.id}" readonly="${attrs.val}">`)
            expect(err.message).to.include('Fix this problem, or use {force: true} to disable error checking.')

            done()
          })
        })
      })

      it('throws when not textarea or text-like', (done) => {
        cy.timeout(300)
        cy.get('div#nested-find').type('foo')

        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.type() failed because it requires a valid typeable element.')
          expect(err.message).to.include('The element typed into was:')
          expect(err.message).to.include('<div id="nested-find">Nested ...</div>')
          expect(err.message).to.include(`A typeable element matches one of the following selectors:`)
          done()
        })
      })

      it('throws when subject is a collection of elements', function (done) {
        cy.get('textarea,:text').then(function ($inputs) {
          this.num = $inputs.length

          $inputs
        }).type('foo')

        cy.on('fail', (err) => {
          expect(err.message).to.include(`cy.type() can only be called on a single element. Your subject contained ${this.num} elements.`)

          done()
        })
      })

      it('throws when the subject isnt visible', function (done) {
        cy.$$('input:text:first').show().hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(2)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('cy.type() failed because this element is not visible')

          done()
        })

        cy.get('input:text:first').type('foo')
      })

      it('throws when subject is disabled', function (done) {
        cy.$$('input:text:first').prop('disabled', true)

        cy.on('fail', (err) => {
          // get + type logs
          expect(this.logs.length).eq(2)
          expect(err.message).to.include('cy.type() failed because this element is disabled:\n')

          done()
        })

        cy.get('input:text:first').type('foo')
      })

      it('throws when submitting within nested forms')

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.type('foobar')
      })

      it('throws when input cannot be clicked', function (done) {
        const $input = $('<input />')
        .attr('id', 'input-covered-in-span')
        .prependTo(cy.$$('body'))

        $('<span>span on button</span>')
        .css({
          position: 'absolute',
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: 'inline-block',
          backgroundColor: 'yellow',
        })
        .prependTo(cy.$$('body'))

        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.include('cy.type() failed because this element')
          expect(err.message).to.include('is being covered by another element')

          done()
        })

        cy.get('#input-covered-in-span').type('foo')
      })

      it('throws when special characters dont exist', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)

          const allChars = _.keys(Cypress.Keyboard.getKeymap()).join(', ')

          expect(err.message).to.eq(`Special character sequence: '{bar}' is not recognized. Available sequences are: ${allChars}

If you want to skip parsing special character sequences and type the text exactly as written, pass the option: {parseSpecialCharSequences: false}

https://on.cypress.io/type`)

          done()
        })

        cy.get(':text:first').type('foo{bar}')
      })

      it('throws when attemping to type tab', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('{tab} isn\'t a supported character sequence. You\'ll want to use the command cy.tab(), which is not ready yet, but when it is done that\'s what you\'ll use.')
          done()
        })

        cy.get(':text:first').type('foo{tab}')
      })

      it('throws on an empty string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('cy.type() cannot accept an empty String. You need to actually type something.')
          done()
        })

        cy.get(':text:first').type('')
      })

      it('allows typing spaces', () => {
        cy
        .get(':text:first').type(' ')
        .should('have.value', ' ')
      })

      it('allows typing special characters', () => {
        cy
        .get(':text:first').type('{esc}')
        .should('have.value', '')
      })

      _.each(['toString', 'toLocaleString', 'hasOwnProperty', 'valueOf',
        'undefined', 'null', 'true', 'false', 'True', 'False'], (val) => {
        it(`allows typing reserved Javscript word (${val})`, () => {
          cy
          .get(':text:first').type(val)
          .should('have.value', val)
        })
      })

      describe('naughty strings', () => {
        _.each(['Ω≈ç√∫˜µ≤≥÷', '2.2250738585072011e-308', '田中さんにあげて下さい',
          '<foo val=`bar\' />', '⁰⁴⁵₀₁₂', '🐵 🙈 🙉 🙊',
          '<script>alert(123)</script>', '$USER'], (val) => {
          it(`allows typing some naughty strings (${val})`, () => {
            cy
            .get(':text:first').type(val)
            .should('have.value', val)
          })
        })
      })

      it('allows typing special characters', () => {
        cy
        .get(':text:first').type('{esc}')
        .should('have.value', '')
      })

      it('can type into input with invalid type attribute', () => {
        cy.get(':text:first')
        .invoke('attr', 'type', 'asdf')
        .type('foobar')
        .should('have.value', 'foobar')
      })

      describe('throws when trying to type', () => {
        _.each([NaN, Infinity, [], {}, null, undefined], (val) => {
          it(`throws when trying to type: ${val}`, function (done) {
            const logs = []

            cy.on('log:added', (attrs, log) => {
              return logs.push(log)
            })

            cy.on('fail', (err) => {
              expect(this.logs.length).to.eq(2)
              expect(err.message).to.eq(`cy.type() can only accept a String or Number. You passed in: '${val}'`)
              done()
            })

            cy.get(':text:first').type(val)
          })
        })
      })

      it('throws when type is canceled by preventingDefault mousedown')

      it('throws when element animation exceeds timeout', (done) => {
        // force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, 'getDistanceBetween').returns(100000)

        const keydown = cy.stub()

        cy.$$(':text:first').on('keydown', keydown)

        cy.on('fail', (err) => {
          expect(keydown).not.to.be.called
          expect(err.message).to.include('cy.type() could not be issued because this element is currently animating:\n')

          done()
        })

        cy.get(':text:first').type('foo')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.get('input:first').type('f').should('have.class', 'typed')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          expect(this.logs.length).to.eq(3)

          done()
        })

        cy.get('input:first').type('f').should('have.class', 'typed')
      })

      context('[type=date]', () => {
        it('throws when chars is not a string', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a date input with cy.type() requires a valid date with the format \'yyyy-MM-dd\'. You passed: 1989')

            done()
          })

          cy.get('#date-without-value').type(1989)
        })

        it('throws when chars is invalid format', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a date input with cy.type() requires a valid date with the format \'yyyy-MM-dd\'. You passed: 01-01-1989')

            done()
          })

          cy.get('#date-without-value').type('01-01-1989')
        })

        it('throws when chars is invalid date', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a date input with cy.type() requires a valid date with the format \'yyyy-MM-dd\'. You passed: 1989-04-31')

            done()
          })

          cy.get('#date-without-value').type('1989-04-31')
        })
      })

      context('[type=month]', () => {
        it('throws when chars is not a string', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a month input with cy.type() requires a valid month with the format \'yyyy-MM\'. You passed: 6')

            done()
          })

          cy.get('#month-without-value').type(6)
        })

        it('throws when chars is invalid format', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a month input with cy.type() requires a valid month with the format \'yyyy-MM\'. You passed: 01/2000')

            done()
          })

          cy.get('#month-without-value').type('01/2000')
        })

        it('throws when chars is invalid month', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a month input with cy.type() requires a valid month with the format \'yyyy-MM\'. You passed: 1989-13')

            done()
          })

          cy.get('#month-without-value').type('1989-13')
        })
      })

      context('[type=tel]', () => {
        it('can edit tel', () => {
          cy.get('#by-name > input[type="tel"]')
          .type('1234567890')
          .should('have.prop', 'value', '1234567890')
        })
      })

      // it "throws when chars is invalid format", (done) ->
      //   cy.on "fail", (err) =>
      //     expect(@logs.length).to.eq(2)
      //     expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18")
      //     done()

      context('[type=week]', () => {
        it('throws when chars is not a string', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a week input with cy.type() requires a valid week with the format \'yyyy-Www\', where W is the literal character \'W\' and ww is the week number (00-53). You passed: 23')

            done()
          })

          cy.get('#week-without-value').type(23)
        })

        it('throws when chars is invalid format', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a week input with cy.type() requires a valid week with the format \'yyyy-Www\', where W is the literal character \'W\' and ww is the week number (00-53). You passed: 2005/W18')

            done()
          })

          cy.get('#week-without-value').type('2005/W18')
        })

        it('throws when chars is invalid week', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq('Typing into a week input with cy.type() requires a valid week with the format \'yyyy-Www\', where W is the literal character \'W\' and ww is the week number (00-53). You passed: 1995-W60')

            done()
          })

          cy.get('#week-without-value').type('1995-W60')
        })
      })

      context('[type=time]', () => {
        it('throws when chars is not a string', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.equal(2)
            expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 9999')

            done()
          })

          cy.get('#time-without-value').type(9999)
        })

        it('throws when chars is invalid format (1:30)', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.equal(2)
            expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 1:30')

            done()
          })

          cy.get('#time-without-value').type('1:30')
        })

        it('throws when chars is invalid format (01:30pm)', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.equal(2)
            expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30pm')

            done()
          })

          cy.get('#time-without-value').type('01:30pm')
        })

        it('throws when chars is invalid format (01:30:30.3333)', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.equal(2)
            expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30:30.3333')

            done()
          })

          cy.get('#time-without-value').type('01:30:30.3333')
        })

        it('throws when chars is invalid time', function (done) {
          cy.on('fail', (err) => {
            expect(this.logs.length).to.equal(2)
            expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:60')

            done()
          })

          cy.get('#time-without-value').type('01:60')
        })
      })
    })
  })

  context('#clear', () => {
    it('does not change the subject', () => {
      const textarea = cy.$$('textarea')

      cy.get('textarea').clear().then(($textarea) => {
        expect($textarea).to.match(textarea)
      })
    })

    it('removes the current value', () => {
      const textarea = cy.$$('#comments')

      textarea.val('foo bar')

      // make sure it really has that value first
      expect(textarea).to.have.value('foo bar')

      cy.get('#comments').clear().then(($textarea) => {
        expect($textarea).to.have.value('')
      })
    })

    it('waits until element is no longer disabled', () => {
      const clicked = cy.stub()
      const textarea = cy.$$('#comments').val('foo bar').prop('disabled', true)

      const retried = cy.stub()

      textarea.on('click', clicked)

      cy.on('command:retry', _.after(3, () => {
        textarea.prop('disabled', false)
        retried()
      }))

      cy.get('#comments').clear().then(() => {
        expect(clicked).to.be.calledOnce

        expect(retried).to.be.called
      })
    })

    it('can forcibly click even when being covered by another element', () => {
      const $input = $('<input />')
      .attr('id', 'input-covered-in-span')
      .prependTo(cy.$$('body'))

      $('<span>span on input</span>')
      .css({
        position: 'absolute',
        left: $input.offset().left,
        top: $input.offset().top,
        padding: 5,
        display: 'inline-block',
        backgroundColor: 'yellow',
      })
      .prependTo(cy.$$('body'))

      const clicked = cy.stub()

      $input.on('click', clicked)

      cy.get('#input-covered-in-span').clear({ force: true }).then(() => {
        expect(clicked).to.be.called
      })
    })

    it('passes timeout and interval down to click', (done) => {
      const input = $('<input />').attr('id', 'input-covered-in-span').prependTo(cy.$$('body'))

      $('<span>span on input</span>').css({ position: 'absolute', left: input.offset().left, top: input.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

      cy.on('command:retry', (options) => {
        expect(options.timeout).to.eq(1000)
        expect(options.interval).to.eq(60)

        done()
      })

      cy.get('#input-covered-in-span').clear({ timeout: 1000, interval: 60 })
    })

    context('works on input type', () => {
      const inputTypes = [
        'date',
        'datetime',
        'datetime-local',
        'email',
        'month',
        'number',
        'password',
        'search',
        'tel',
        'text',
        'time',
        'url',
        'week',
      ]

      inputTypes.forEach((type) => {
        it(type, () => {
          cy.get(`#${type}-with-value`).clear().then(($input) => {
            expect($input.val()).to.equal('')
          })
        })
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        null
      })

      it('eventually passes the assertion', () => {
        cy.$$('input:first').keyup(function () {
          _.delay(() => {
            $(this).addClass('cleared')
          }
          , 100)
        })

        cy.get('input:first').clear().should('have.class', 'cleared').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })

      it('eventually passes the assertion on multiple inputs', () => {
        cy.$$('input').keyup(function () {
          _.delay(() => {
            $(this).addClass('cleared')
          }
          , 100)
        })

        cy.get('input').invoke('slice', 0, 2).clear().should('have.class', 'cleared')
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', (err) => {
          done()
        })

        cy.noop({}).clear()
      })

      it('throws when subject is not in the document', (done) => {
        const cleared = cy.stub()

        const input = cy.$$('input:first').val('123').keydown((e) => {
          cleared()

          input.remove()
        })

        cy.on('fail', (err) => {
          expect(cleared).to.be.calledOnce
          expect(err.message).to.include('cy.clear() failed because this element')

          done()
        })

        cy.get('input:first').clear().clear()
      })

      it('throws if any subject isnt a textarea or text-like', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(3)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
          expect(err.message).to.include('The element cleared was:')
          expect(err.message).to.include('<form id="checkboxes">...</form>')
          expect(err.message).to.include(`A clearable element matches one of the following selectors:`)

          done()
        })

        cy.get('textarea:first,form#checkboxes').clear()
      })

      it('throws if any subject isnt a :text', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
          expect(err.message).to.include('The element cleared was:')
          expect(err.message).to.include('<div id="dom">...</div>')
          expect(err.message).to.include(`A clearable element matches one of the following selectors:`)

          done()
        })

        cy.get('div').clear()
      })

      it('throws on an input radio', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
          expect(err.message).to.include('The element cleared was:')
          expect(err.message).to.include('<input type="radio" name="gender" value="male">')
          expect(err.message).to.include(`A clearable element matches one of the following selectors:`)
          done()
        })

        cy.get(':radio').clear()
      })

      it('throws on an input checkbox', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
          expect(err.message).to.include('The element cleared was:')
          expect(err.message).to.include('<input type="checkbox" name="colors" value="blue">')
          expect(err.message).to.include(`A clearable element matches one of the following selectors:`)

          done()
        })

        cy.get(':checkbox').clear()
      })

      it('throws when the subject isnt visible', (done) => {
        cy.$$('input:text:first').show().hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('cy.clear() failed because this element is not visible')

          done()
        })

        cy.get('input:text:first').clear()
      })

      it('throws when subject is disabled', function (done) {
        cy.$$('input:text:first').prop('disabled', true)

        cy.on('fail', (err) => {
          // get + type logs
          expect(this.logs.length).eq(2)
          expect(err.message).to.include('cy.clear() failed because this element is disabled:\n')

          done()
        })

        cy.get('input:text:first').clear()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clear()
      })

      it('throws when input cannot be cleared', function (done) {
        const $input = $('<input />')
        .attr('id', 'input-covered-in-span')
        .prependTo(cy.$$('body'))

        $('<span>span on input</span>')
        .css({
          position: 'absolute',
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: 'inline-block',
          backgroundColor: 'yellow',
        })
        .prependTo(cy.$$('body'))

        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.include('cy.clear() failed because this element')
          expect(err.message).to.include('is being covered by another element')

          done()
        })

        cy.get('#input-covered-in-span').clear()
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.get('input:first').clear().should('have.class', 'cleared')
      })

      it('does not log an additional log on failure', function (done) {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          return logs.push(log)
        })

        cy.on('fail', () => {
          expect(this.logs.length).to.eq(3)

          done()
        })

        cy.get('input:first').clear().should('have.class', 'cleared')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        null
      })

      it('logs immediately before resolving', () => {
        const $input = cy.$$('input:first')

        let expected = false

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'clear') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($input.get(0))

            expected = true
          }
        })

        cy.get('input:first').clear().then(() => {
          expect(expected).to.be.true
        })
      })

      it('ends', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'clear') {
            logs.push(log)
          }
        })

        cy.get('input').invoke('slice', 0, 2).clear().then(() => {
          _.each(logs, (log) => {
            expect(log.get('state')).to.eq('passed')

            expect(log.get('ended')).to.be.true
          })
        })
      })

      it('snapshots after clicking', () => {
        cy.get('input:first').clear().then(function ($input) {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs deltaOptions', () => {
        cy.get('input:first').clear({ force: true, timeout: 1000 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{force: true, timeout: 1000}')

          expect(lastLog.invoke('consoleProps').Options).to.deep.eq({ force: true, timeout: 1000 })
        })
      })
    })
  })

  describe('user experience', () => {
    it('can print table of keys on click', () => {
      cy.get('input:first').type('foo')

      .then(() => {
        return withMutableReporterState(() => {
          const spyTableName = cy.spy(top.console, 'groupCollapsed')
          const spyTableData = cy.spy(top.console, 'table')

          const commandLogEl = getCommandLogWithText('foo')

          const reactCommandInstance = findReactInstance(commandLogEl[0])

          reactCommandInstance.props.appState.isRunning = false

          $(commandLogEl).find('.command-wrapper').click()

          expect(spyTableName.firstCall).calledWith('Mouse Events')
          expect(spyTableName.secondCall).calledWith('Keyboard Events')
          expect(spyTableData).calledTwice
        })
      })
    })
  })
})
