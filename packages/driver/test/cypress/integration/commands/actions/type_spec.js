const $ = Cypress.$.bind(Cypress)
const { _ } = Cypress
const { Promise } = Cypress
const {
  getCommandLogWithText,
  findReactInstance,
  withMutableReporterState,
  attachKeyListeners,
  keyEvents,
  trimInnerText,
  shouldBeCalledWithCount,
  shouldBeCalledOnce,
} = require('../../../support/utils')

const expectTextEndsWith = (expected) => {
  return ($el) => {
    const text = $el.text().trim()

    const passed = text.endsWith(expected)

    const displayText = text.length > 300 ? (`${text.slice(0, 100)}...${text.slice(-100)}`) : text

    assert(passed, `expected ${displayText} to end with ${expected}`)
  }
}

describe('src/cy/commands/actions/type - #type', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

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

  it('types in readonly if force is enabled', () => {
    cy.get('#readonly-attr').type('foo', { force: true })
    .should('have.value', 'foo')
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
      expect(trimInnerText($div)).to.eq((`${oldText} foo`))
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

    it('can force type when element is disabled', () => {
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
    beforeEach(() => {
      this.$div = cy.$$('#tabindex')
    })

    it('receives keydown, keyup, keypress', () => {
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

    it('does not receive textInput', () => {
      let textInput = false

      this.$div.on('textInput', () => {
        textInput = true
      })

      cy.get('#tabindex').type('f').then(() => {
        expect(textInput).to.be.false
      })
    })

    it('does not receive input', () => {
      let input = false

      this.$div.on('input', () => {
        input = true
      })

      cy.get('#tabindex').type('f').then(() => {
        expect(input).to.be.false
      })
    })

    it('does not receive change event', () => {
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

    it('does not change inner text', () => {
      const innerText = this.$div.text()

      cy.get('#tabindex').type('foo{leftarrow}{del}{rightarrow}{enter}').should('have.text', innerText)
    })

    it('receives focus', () => {
      let focus = false

      this.$div.focus(() => {
        focus = true
      })

      cy.get('#tabindex').type('f').then(() => {
        expect(focus).to.be.true
      })
    })

    it('receives blur', () => {
      let blur = false

      this.$div.blur(() => {
        blur = true
      })

      cy.get('#tabindex').type('f')
      cy.get('input:first').focus().then(() => {
        expect(blur).to.be.true
      })
    })

    it('receives keydown and keyup for other special characters and keypress for enter and regular characters', () => {
      const keydowns = cy.stub()
      const keyups = cy.stub()
      const keypresses = cy.stub()

      this.$div.keydown(keydowns)

      this.$div.keypress(keypresses)

      this.$div.keyup(keyups)

      cy.get('#tabindex').type('f{leftarrow}{rightarrow}{enter}')
      .then(() => {
        expect(keydowns).callCount(4)
        expect(keypresses).callCount(2)

        expect(keyups).callCount(4)
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

      $txt[0].addEventListener('textInput', (e) => {
        // FIXME: (firefox) firefox cannot access window objects else throw cross-origin error
        expect(Object.prototype.toString.call(e.view)).eq('[object Window]')
        e.view = null
        expect(_.toPlainObject(e)).to.include({
          bubbles: true,
          cancelable: true,
          data: 'a',
          detail: 0,
          type: 'textInput',
          // view: cy.state('window'),
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
        onInput.resetHistory()
      })

      cy.get(':text:first')
      .invoke('val', 'bar')
      .type('{selectAll}{leftarrow}{del}')
      .then(() => {
        expect(onInput).to.be.calledOnce
      })
      .then(() => {
        onInput.resetHistory()
      })

      cy.$$('[contenteditable]:first').on('input', onInput)

      cy.get('[contenteditable]:first')
      .invoke('html', 'foobar')
      .type('{selectAll}{rightarrow}{backspace}')
      .then(() => {
        expect(onInput).to.be.calledOnce
      })
      .then(() => {
        onInput.resetHistory()
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
      cy.$$('#input-without-value').val('0').click(() => {
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
      cy.$$('#input-without-value').val('0').mouseup(() => {
        $(this).select()
      })
    })

    // https://github.com/cypress-io/cypress/issues/5703
    it('overwrites text when selectAll in focus handler', () => {
      const input = cy.$$('#input-without-value')

      input
      .val('f')
      .on('focus', (e) => {
        e.currentTarget.select()
      })

      cy.get('#input-without-value')
      .type('foo')
      .should('have.value', 'foo')
    })

    it('overwrites text when selectAll in focus handler in number', () => {
      const input = cy.$$('#number-without-value')

      input
      .val('1')
      .on('focus', (e) => {
        e.currentTarget.select()
      })

      cy.get('#number-without-value')
      .type('10')
      .should('have.value', '10')
    })

    it('overwrites text when selectAll in focus handler in email', () => {
      const input = cy.$$('#email-without-value')

      input
      .val('b')
      .on('focus', (e) => {
        e.currentTarget.select()
      })

      cy.get('#email-without-value')
      .type('b@foo.com')
      .should('have.value', 'b@foo.com')
    })

    it('overwrites text when selectAll in mouseup handler', () => {
      cy.$$('#input-without-value').val('0').mouseup(() => {
        $(this).select()
      })
    })

    it('responsive to keydown handler', () => {
      cy.$$('#input-without-value').val('1234').keydown(() => {
        $(this).get(0).setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('651234')
      })
    })

    it('responsive to keyup handler', () => {
      cy.$$('#input-without-value').val('1234').keyup(() => {
        $(this).get(0).setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('612345')
      })
    })

    it('responsive to input handler', () => {
      cy.$$('#input-without-value').val('1234').keyup(() => {
        $(this).get(0).setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('612345')
      })
    })

    it('responsive to change handler', () => {
      cy.$$('#input-without-value').val('1234').change(() => {
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
        cy.get('#number-without-value')
        .type('2.0')
        .then(($input) => {
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

      // https://github.com/cypress-io/cypress/issues/6055
      it('can type negative numbers and dismiss invalid characters', () => {
        cy.get('#number-without-value')
        .type('-a42')
        .should('have.value', '-42')
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

      // https://github.com/cypress-io/cypress/issues/5997
      it('type=number can accept values with commas (,)', () => {
        cy.get('#number-without-value')
        .type('1,000')
        .should('have.value', '1000')
      })

      // https://github.com/cypress-io/cypress/issues/5968
      it('type=number can include {enter}', () => {
        cy.get('#number-without-value')
        .type('100{enter}')
        .should('have.value', '100')
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

        cy.$$('area:first').on('keydown', keydown)

        cy.get('area:first')
        // TODO: look into why using .then here does not retry chained assertions
        .should(($el) => {
          $el.focus()
        })
        .should('be.focused')
        .type('foo')
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
        const ce = cy.$$('#input-types [contenteditable]')

        attachKeyListeners({ ce })

        cy.get('#input-types [contenteditable]')
        .invoke('text', 'foo')
        .type('f')
        .should(($text) => {
          expect(trimInnerText($text)).eq('foof')
        })

        cy.getAll('ce', 'keydown keypress textInput input keyup').each(shouldBeCalledOnce)
      })

      it('{enter} inserts text with only one input event', () => {
        const ce = cy.$$('#input-types [contenteditable]')

        attachKeyListeners({ ce })

        cy.get('#input-types [contenteditable]')
        .invoke('text', 'foo')
        .type('{enter}')
        .should(($text) => {
          expect(trimInnerText($text)).eq('foo')
        })

        cy.getAll('ce', 'keydown keypress textInput input keyup').each(shouldBeCalledOnce)
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

      it('can type into [contenteditable] with existing text', () => {
        cy.$$('[contenteditable]:first').get(0).innerHTML = '<p>foo</p>'

        cy.get('[contenteditable]:first')
        .type('bar').then(($div) => {
          expect(trimInnerText($div)).to.eql('foobar')
          expect($div.get(0).textContent).to.eql('foobar')

          expect($div.get(0).innerHTML).to.eql('<p>foobar</p>')
        })
      })

      it('collapses selection to start on {leftarrow}', () => {
        cy.$$('[contenteditable]:first').get(0).innerHTML = 'bar'

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}foo')
        .then(($div) => {
          expect(trimInnerText($div)).to.eql('foobar')
        })
      })

      it('collapses selection to end on {rightarrow}', () => {
        cy.$$('[contenteditable]:first').get(0).innerHTML = 'bar'

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
        .type('foobar')

        .then(($div) => {
          expect(trimInnerText($div)).eq('foobar')
        })
      })

      function insertIframe () {
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
      }

      it('can type in designmode="on"', () => {
        cy.timeout(100)
        cy.state('document').designMode = 'on'
        cy.state('document').documentElement.focus()
        cy.get('div.item:first')
        .type('111')

        cy.get('body').then(expectTextEndsWith('111'))
      })

      // TODO[breaking]: we should edit div.item:first text content instead of
      // moving to the end of the host contenteditable. This will allow targeting
      // specific elements to simplify testing rich editors
      it('can type in body[contenteditable]', () => {
        cy.state('document').body.setAttribute('contenteditable', true)
        cy.state('document').documentElement.focus()
        cy.get('div.item:first')
        .type('111')

        cy.get('body')
        .then(expectTextEndsWith('111'))
      })

      // https://github.com/cypress-io/cypress/issues/5930
      it('can type into an iframe with body[contenteditable]', () => {
        insertIframe()
        cy.get('#generic-iframe').then(($iframe) => {
          cy.wrap($iframe.contents().find('html').first().find('body'))
          .then(($body) => {
            $body.attr('contenteditable', true)
          })
          .type('111')
          .then(expectTextEndsWith('111'))
        })
      })

      it(`can type into an iframe with designmode = 'on'`, () => {
        // append a new iframe to the body
        insertIframe()
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
      beforeEach(() => {
        this.$input = cy.$$('input:text:first')

        cy.get('input:text:first').type('{command}{option}', { release: false })
      })

      afterEach(() => {
        this.$input.off('keydown')
      })

      it('sends keydown event for new modifiers', () => {
        const spy = cy.spy().as('keydown')

        this.$input.on('keydown', spy)

        cy.get('input:text:first').type('{shift}').then(() => {
          expect(spy).to.be.calledWithMatch({ which: 16 })
        })
      })

      it('does not send keydown event for already activated modifiers', () => {
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

    it('accurately returns documentElement el when contenteditable="false" attr', () => {
      cy.$$('<div contenteditable="false"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

      cy.get('#ce-inner1').then(($el) => {
        expect(Cypress.dom.getHostContenteditable($el[0])).to.eq($el[0].ownerDocument.documentElement)
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

        cy.get('div:contains(bar):last').type('new text')
        .should(($el) => {
          expect(trimInnerText($el)).eq('new text')
        })
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

    it('can wrap cursor to next line in [contenteditable] with {rightarrow} and empty lines', () => {
      const $el = cy.$$('[contenteditable]:first')
      const el = $el.get(0)

      el.innerText = `${'\n'.repeat(4)}end`

      cy.get('[contenteditable]:first')
      .type('{selectall}{leftarrow}')
      .type(`foobar${'{rightarrow}'.repeat(6)}[_I_]`).then(() => {
        expect(trimInnerText($el)).to.eql(`foobar\n\n\n\nen[_I_]d`)
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

  describe('assertion verification', () => {
    beforeEach(() => {
      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'assert') {
          this.lastLog = log
        }
      })

      null
    })

    it('eventually passes the assertion', () => {
      cy.$$('input:first').keyup(() => {
        _.delay(() => {
          $(this).addClass('typed')
        }
        , 100)
      })

      cy.get('input:first').type('f').should('have.class', 'typed').then(() => {
        const { lastLog } = this

        expect(lastLog.get('name')).to.eq('assert')
        expect(lastLog.get('state')).to.eq('passed')

        expect(lastLog.get('ended')).to.be.true
      })
    })
  })

  describe('.log', () => {
    beforeEach(() => {
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
      cy.get(':text:first').type('foobar').then(() => {
        const { lastLog } = this

        expect(lastLog.get('message')).to.eq('foobar')
      })
    })

    it('logs delay arguments', () => {
      cy.get(':text:first').type('foo', { delay: 20 }).then(() => {
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

    it('snapshots before typing', () => {
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
      cy.get(':text:first').type('foo').then(() => {
        const { lastLog } = this

        expect(lastLog.get('snapshots').length).to.eq(2)
        expect(lastLog.get('snapshots')[1].name).to.eq('after')

        expect(lastLog.get('snapshots')[1].body).to.be.an('object')
      })
    })

    it('logs deltaOptions', () => {
      cy.get(':text:first').type('foo', { force: true, timeout: 1000 }).then(() => {
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
