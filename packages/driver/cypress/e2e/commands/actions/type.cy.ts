import {
  clickCommandLog,
  attachKeyListeners,
  keyEvents,
  trimInnerText,
  shouldBeCalledWithCount,
  shouldBeCalledOnce,
} from '../../../support/utils'

const { _, $ } = Cypress
const { Promise } = Cypress

const expectTextEndsWith = (expected) => {
  return ($el) => {
    // only want to compare the body text, not text in <script> tag
    const text = $el[0].innerText.trim()

    const passed = text.endsWith(expected)

    const displayText = text.length > 300 ? (`${text.slice(0, 100)}...${text.slice(-100)}`) : text

    assert(passed, `expected ${displayText} to end with ${expected}`)
  }
}

const isWebKit = Cypress.isBrowser('webkit')

describe('src/cy/commands/actions/type - #type', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('does not change the subject', () => {
    const input = cy.$$('input:first')

    cy.get('input:first').type('foo').then(($input) => {
      expect($input[0]).to.eq(input[0])
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
      const el = $el[0] as unknown as HTMLInputElement

      el.setSelectionRange(0, 0)
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
      const input = $input[0] as unknown as HTMLInputElement

      input.value += '-'

      return $input
    }).type('456')
    .should('have.value', '123-456')
  })

  it('can type numbers', () => {
    // @ts-expect-error - numbers work in text inputs only and error in other inputs
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

  it('can type into an input when given a wrapper element', () => {
    cy.get('#focus div span').type('foo')
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

  // https://github.com/cypress-io/cypress/issues/6125
  it('works even if Event class is overridden', () => {
    cy.visit('fixtures/issue-6125.html')
    cy.get('#login_username')
    .type('foobar')
  })

  // https://github.com/cypress-io/cypress/issues/5650
  it('should trigger KeyboardEvent, not Event, for event listeners', (done) => {
    cy.$$('input:first').on('keydown', (e) => {
      // @ts-expect-error - TODO: Need to get this to not throw error
      if (e.originalEvent instanceof e.currentTarget.ownerDocument.defaultView?.KeyboardEvent) {
        done()

        return
      }

      throw new Error('event was not instanceOf KeyboardEvent')
    })

    cy.get('input:first').type('A')
  })

  describe('actionability', () => {
    let retries = 0

    beforeEach(() => {
      retries = 0
      cy.on('command:retry', () => {
        retries += 1
      })
    })

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
      .css('position', 'absolute')
      .css('left', `${$input.offset()?.left}`)
      .css('top', `${$input.offset()?.top}`)
      .css('padding', '5px')
      .css('display', 'inline-block')
      .css('backgroundColor', 'yellow')
      .prependTo(cy.$$('body'))

      const clicked = cy.stub()

      $input.on('click', clicked)

      cy.get('#input-covered-in-span').type('foo', { force: true }).then(($input) => {
        expect(clicked).to.be.calledOnce

        expect($input).to.have.value('foo')
      })
    })

    it('can type when element has `opacity: 0`', () => {
      cy.$$('input:text:first').css('opacity', 0)
      cy.get('input:text:first').type('foo')
      .should('have.value', 'foo')
    })

    it('waits until element becomes visible', () => {
      const $txt = cy.$$(':text:first').hide()

      cy.on('command:retry', _.after(3, () => {
        // Replace the element with a copy of itself, to ensure that .type() requeries the DOM
        // while retrying actionability
        $txt.replaceWith($txt[0].innerHTML)
        cy.$$(':text:first').show()
      }))

      cy.get(':text:first').type('foo').then(() => {
        expect(retries).to.be.gt(1)
      })
    })

    it('waits until element is no longer disabled', () => {
      const $txt = cy.$$(':text:first').prop('disabled', true)

      const clicked = cy.stub()

      $txt.on('click', clicked)

      cy.on('command:retry', _.after(3, () => {
        $txt.prop('disabled', false)
      }))

      cy.get(':text:first').type('foo').then(() => {
        expect(clicked).to.be.calledOnce
        expect(retries).to.be.gt(1)
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
      cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).type('foo').then(() => {
        expect(retries).to.be.gte(1)
      })
    })

    it('does not wait when waiting for animations is disabled', {
      waitForAnimations: false,
    }, () => {
      cy.get(':text:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).type('foo').then(() => {
        expect(retries).to.eq(0)
      })
    })

    it('does not wait when turning off waitForAnimations in options', () => {
      cy.get(':text:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).type('foo', { waitForAnimations: false }).then(() => {
        expect(retries).to.eq(0)
      })
    })

    it('passes options.animationDistanceThreshold to ensureElementIsNotAnimating', () => {
      cy.get(':text:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).type('foo', { animationDistanceThreshold: 1000 }).then(($txt) => {
        // One retry, because $actionability always waits for two sets of points to determine if an element is animating.
        expect(retries).to.eq(1)
      })
    })

    it('passes config.animationDistanceThreshold to ensureElementIsNotAnimating', () => {
      let old = Cypress.config('animationDistanceThreshold')

      Cypress.config('animationDistanceThreshold', 1000)

      cy.get(':text:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).type('foo').then(($txt) => {
        // One retry, because $actionability always waits for two sets of points to determine if an element is animating.
        try {
          expect(retries).to.eq(1)
        } finally {
          Cypress.config('animationDistanceThreshold', old)
        }
      })
    })

    it('can specify scrollBehavior in options', () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo', { scrollBehavior: 'bottom' })

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).to.be.calledWith({ block: 'end' })
      })
    })

    it('does not scroll when scrollBehavior is false in options', () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo', { scrollBehavior: false })

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).not.to.be.called
      })
    })

    it('can specify scrollBehavior bottom in config', { scrollBehavior: 'bottom' }, () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo')

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).to.be.calledWith({ block: 'end' })
      })
    })

    it('can specify scrollBehavior center in config', { scrollBehavior: 'center' }, () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo')

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).to.be.calledWith({ block: 'center' })
      })
    })

    it('can specify scrollBehavior nearest in config', { scrollBehavior: 'nearest' }, () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo')

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).to.be.calledWith({ block: 'nearest' })
      })
    })

    it('does not scroll when scrollBehavior is false in config', { scrollBehavior: false }, () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo')

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).not.to.be.called
      })
    })

    it('calls scrollIntoView by default', () => {
      cy.get(':text:first').then((el) => {
        cy.spy(el[0], 'scrollIntoView')
      })

      cy.get(':text:first').type('foo')

      cy.get(':text:first').then((el) => {
        expect(el[0].scrollIntoView).to.be.calledWith({ block: 'start' })
      })
    })

    // https://github.com/cypress-io/cypress/issues/4233
    it('can scroll to an element behind a sticky header', () => {
      cy.viewport(400, 400)
      cy.visit('./fixtures/sticky-header.html')
      cy.get('input:first').type('foo')
    })

    it('errors when scrollBehavior is false and element is out of view and is clicked', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.type()` failed because the center of this element is hidden from view')
        expect(cy.state('window').scrollY).to.equal(0)
        expect(cy.state('window').scrollX).to.equal(0)

        done()
      })

      // make sure the input is out of view
      const $body = cy.$$('body')

      $('<div>Long block 5</div>')
      .css({
        height: '500px',
        border: '1px solid red',
        marginTop: '10px',
        width: '100%',
      }).prependTo($body)

      cy.get(':text:first').type('foo', { scrollBehavior: false, timeout: 200 })
    })

    describe('retries in after hook when failures', () => {
      it('types in element in hook', () => {
        cy.on('fail', (err) => {
          expect(err.message).contain('expected true to be false')
        })

        expect(true).to.be.false
      })

      after(() => {
        const input = cy.$$('input:text:first')

        input.val('')

        expect(input).to.have.value('')

        cy.get('input:text:first').type('foo').then(($input) => {
          expect($input).to.have.value('foo')
        })
      })
    })

    describe('retries in afterEach hook when failures', () => {
      it('types in element in hook', () => {
        cy.on('fail', (err) => {
          expect(err.message).contain('expected true to be false')
        })

        expect(true).to.be.false
      })

      afterEach(() => {
        const input = cy.$$('input:text:first')

        input.val('')

        expect(input).to.have.value('')

        cy.get('input:text:first').type('foo').then(($input) => {
          expect($input).to.have.value('foo')
        })
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

  describe('button-like input types', () => {
    _.each([
      'button',
      'image',
      'reset',
      'submit',
      'checkbox',
      'radio',
    ], (type) => {
      describe(`[type=${type}]`, () => {
        let input

        beforeEach(() => {
          input = cy.$$(`<input type='${type}' id='button-like-input-type-${type}' value="foo" />`)
          cy.$$('body').append(input)
        })

        it(`value does not change when typing on `, () => {
          cy
          .get(`#button-like-input-type-${type}`)
          .type('bar')
          .should('have.value', 'foo')
        })
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
    it('adds default delay to delta for each key sequence', () => {
      cy.spy(cy, 'timeout')

      cy.get(':text:first')
      .type('foo{enter}bar{leftarrow}')
      .then(() => {
        expect(cy.timeout).to.be.calledWith(10 * 8, true, 'type')
      })
    })

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

    it('test config keystrokeDelay overrides global value', { keystrokeDelay: 5 }, () => {
      cy.spy(cy, 'timeout')

      cy.get(':text:first')
      .type('foo{enter}bar{leftarrow}')
      .then(() => {
        expect(cy.timeout).to.be.calledWith(5 * 8, true, 'type')
      })
    })

    it('delay will override default keystrokeDelay', () => {
      Cypress.Keyboard.defaults({
        keystrokeDelay: 20,
      })

      cy.spy(cy, 'timeout')

      cy.get(':text:first')
      .type('foo{enter}bar{leftarrow}', { delay: 5 })
      .then(() => {
        expect(cy.timeout).to.be.calledWith(5 * 8, true, 'type')

        // @ts-expect-error - TODO: Get this to use the internal Keyboard types
        Cypress.Keyboard.reset()
      })
    })

    it('delay will override test config keystrokeDelay', { keystrokeDelay: 1000 }, () => {
      cy.spy(cy, 'timeout')

      cy.get(':text:first')
      .type('foo{enter}bar{leftarrow}', { delay: 5 })
      .then(() => {
        expect(cy.timeout).to.be.calledWith(5 * 8, true, 'type')
      })
    })

    it('does not increase the timeout delta when delay is 0', () => {
      cy.spy(cy, 'timeout')

      cy.get(':text:first').type('foo{enter}', { delay: 0 }).then(() => {
        expect(cy.timeout).not.to.be.calledWith(0, true, 'type')
      })
    })

    describe('errors', () => {
      it('throws when delay is invalid', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.type()` `delay` option must be 0 (zero) or a positive number. You passed: `false`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/type')
          done()
        })

        // @ts-expect-error - testing invalid input
        cy.get(':text:first').type('foo', { delay: false })
      })

      // @ts-expect-error - testing invalid input
      it('throws when test config keystrokeDelay is invalid', { keystrokeDelay: false }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('The test configuration `keystrokeDelay` option must be 0 (zero) or a positive number. You passed: `false`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/test-configuration')
          done()
        })

        cy.get(':text:first').type('foo')
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
      const events: any[] = []

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
      const events: any[] = []

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
      cy.get('#input-without-value').invoke('val', 'foo')
      cy.get('#input-without-value').type(' bar').then(($text) => {
        expect($text).to.have.value('foo bar')
      })
    })

    it('overwrites text when currently has selection', () => {
      cy.get('#input-without-value').invoke('val', '0').then((el) => {
        const input = el as unknown as HTMLInputElement

        return input.select()
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
          const input = e.currentTarget as HTMLInputElement

          input.setSelectionRange(0, 1)
        })
      })
      .type('bar')
      .should('have.value', 'baroo')
    })

    // WebKit will select all input content on focus. This causes our
    // cursor placement logic to be ignored, as we interpret the default
    // selection as a user-provided selection that we do not want to override.
    // We work around this by preventing the default selection on focus using
    // our own capture-phase 'focus' event handler; this test ensures that user-set
    // capture-phase events continue to function as expected for the purpose
    // of selection updates.
    it('respects changed selection in focus handler during capture phase', () => {
      cy.get('#input-without-value')
      .then(($el) => {
        $el.val('foo')
        $el.get(0).addEventListener('focus', (e) => {
          const input = e.currentTarget as HTMLInputElement

          input.setSelectionRange(0, 1)
        }, { capture: true })
      })
      .type('bar')
      .should('have.value', 'baroo')
    })

    it('overwrites text when selectAll in mouseup handler', () => {
      cy.$$('#input-without-value').val('0').mouseup(function () {
        $(this).select()
      })
    })

    // https://github.com/cypress-io/cypress/issues/5703
    it('overwrites text when selectAll in focus handler', () => {
      const input = cy.$$('#input-without-value')

      input
      .val('f')
      .on('focus', (e) => {
        const input = e.currentTarget as HTMLInputElement

        input.select()
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
        const input = e.currentTarget as HTMLInputElement

        input.select()
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
        const input = e.currentTarget as HTMLInputElement

        input.select()
      })

      cy.get('#email-without-value')
      .type('b@foo.com')
      .should('have.value', 'b@foo.com')
    })

    it('overwrites text when selectAll in mouseup handler', () => {
      cy.$$('#input-without-value').val('0').mouseup(function () {
        $(this).select()
      })
    })

    it('responsive to keydown handler', () => {
      cy.$$('#input-without-value').val('1234').keydown(function () {
        const input = $(this).get(0) as HTMLInputElement

        input.setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('651234')
      })
    })

    it('responsive to keyup handler', () => {
      cy.$$('#input-without-value').val('1234').keyup(function () {
        const input = $(this).get(0) as HTMLInputElement

        input.setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('612345')
      })
    })

    it('responsive to input handler', () => {
      cy.$$('#input-without-value').val('1234').keyup(function () {
        const input = $(this).get(0) as HTMLInputElement

        input.setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('612345')
      })
    })

    it('responsive to change handler', () => {
      cy.$$('#input-without-value').val('1234').change(function () {
        const input = $(this).get(0) as HTMLInputElement

        input.setSelectionRange(0, 0)
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

      it('inserts text after existing text', () => {
        cy.get('#number-with-value').type('34').then(($text) => {
          expect($text).to.have.value('1234')
        })
      })

      it('inserts text after existing text input by invoking val', () => {
        cy.get('#number-without-value').invoke('val', '12')
        cy.get('#number-without-value').type('34').then(($text) => {
          expect($text).to.have.value('1234')
        })
      })

      it('overwrites text on input[type=number] when input has existing text selected', () => {
        cy.get('#number-without-value').invoke('val', '0').then((el) => {
          const input = el as unknown as HTMLInputElement

          return input.select()
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
        cy.get('#email-without-value').invoke('val', 'brian@foo.c')
        cy.get('#email-without-value').type('om').then(($text) => {
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
        cy.get('#password-without-value').invoke('val', 'secr')
        cy.get('#password-without-value').type('et').then(($text) => {
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
          const input = e.target as HTMLInputElement

          input.setSelectionRange(1, 1)
        })

        const select = (e) => {
          e.target.select()
        }

        cy
        .$$('#password-without-value')
        .val('secret')
        .click(select)
        .keyup((e) => {
          const input = e.target as HTMLInputElement

          switch (e.key) {
            case 'g':
              return select(e)
            case 'n':
              return input.setSelectionRange(0, 1)
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
        cy.get('#date-without-value').invoke('val', '2016-01-01')
        cy.get('#date-without-value').type('1959-09-13').then(($text) => {
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
          <img usemap="#map" src="/fixtures/media/cypress.png" alt="image" />
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
        cy.get('#datetime-local-without-value').type('1959-09-13T10:10').should('have.value', '1959-09-13T10:10')
      })

      // https://github.com/cypress-io/cypress/issues/22884
      it('can use seconds', () => {
        cy.get('#datetime-local-without-value').type('1959-09-13T10:12:13').should('have.value', '1959-09-13T10:12:13')
      })

      it('can use fractions of a second', () => {
        cy.get('#datetime-local-without-value').type('1959-09-13T10:12:13.456').should('have.value', '1959-09-13T10:12:13.456')
      })

      it('overwrites existing value', () => {
        cy.get('#datetime-local-without-value').type('1959-09-13T10:10').should('have.value', '1959-09-13T10:10')
      })

      it('overwrites existing value input by invoking val', () => {
        cy.get('#datetime-local-without-value').invoke('val', '2016-01-01T05:05')
        cy.get('#datetime-local-without-value').type('1959-09-13T10:10').should('have.value', '1959-09-13T10:10')
      })

      it('errors when invalid datetime', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).contain('datetime')
          expect(err.message).contain('YYYY-MM-DDThh:mm')
          done()
        })

        cy.get('#datetime-local-without-value').invoke('val', '2016-01-01T05:05').type('1959-09-13')
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
        cy.get('#month-without-value').invoke('val', '2016-01')
        cy.get('#month-without-value').type('1959-09').then(($text) => {
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
        cy.get('#week-without-value').invoke('val', '2016-W01')
        cy.get('#week-without-value').type('1959-W09').then(($text) => {
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
        cy.get('#time-without-value').invoke('val', '01:23:45')
        cy.get('#time-without-value').type('12:34:56').then(($text) => {
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
        cy.get('#input-types [contenteditable]').invoke('text', 'foo')
        cy.get('#input-types [contenteditable]').type(' bar').then(($text) => {
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

        cy.get('#input-types [contenteditable]').invoke('text', 'foo')
        cy.get('#input-types [contenteditable]').type('{enter}')
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
        .then(expectTextEndsWith('111'))
      })

      it('can type in body[contenteditable]', () => {
        cy.state('document').body.setAttribute('contenteditable', true)
        cy.state('document').documentElement.focus()
        cy.get('div.item:first')
        .type('111')
        .then(expectTextEndsWith('111'))
      })

      // https://github.com/cypress-io/cypress/issues/5930
      it('can type into an iframe with body[contenteditable]', () => {
        insertIframe()
        cy.get('#generic-iframe').then(($iframe) => {
          cy.wrap($iframe.contents().find('html').first().find('body'))
          .then(($body) => {
            $body.prop('contenteditable', true)
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
          const iframe = $iframe[0] as unknown as HTMLIFrameElement
          const iframeContents = $iframe.contents()
          const iframeContentDocument = iframe.contentDocument

          if (iframeContentDocument) {
            iframeContentDocument.designMode = 'on'
          }

          cy.wrap(iframeContents.find('html')).first()
          .type('{selectall}{del} foo bar baz{enter}ac{leftarrow}b')
        })

        // assert that text was typed
        cy.get('#generic-iframe')
        .then(($iframe) => {
          const iframe = $iframe[0] as unknown as HTMLIFrameElement
          const iframeText = iframe.contentDocument?.body.innerText

          expect(iframeText).to.include('foo bar baz\nabc')
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/7088
    // In WebKit, setting the inputType is not supported by the InputEvent constructor.
    // This results in the inputType being unset in any of the simulated beforeinput events.
    // https://bugs.webkit.org/show_bug.cgi?id=170416
    describe('beforeInput event', () => {
      it('sends beforeinput in text input', () => {
        const call1 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(' ')
          !isWebKit && expect(e.inputType).eq('insertText')
          stub.callsFake(call2)
        }
        const call2 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq('f')
          !isWebKit && expect(e.inputType).eq('insertText')
          stub.callsFake(call3)
        }
        const call3 = (e) => {
          expect(e.data).eq(null)
          !isWebKit && expect(e.inputType).eq('insertLineBreak')
          stub.callsFake(call4)
        }
        const call4 = (e) => {
          expect(e.data).eq(null)
          !isWebKit && expect(e.inputType).eq('deleteContentBackward')
          stub.callsFake(call5)
        }
        const call5 = (e) => {
          expect(e.data).eq(null)
          !isWebKit && expect(e.inputType).eq('deleteContentForward')
        }

        const stub = cy.stub()
        .callsFake(call1)

        cy.get('input:first')
        .then(($el) => {
          $el.val('foo bar baz')
          $el[0].addEventListener('beforeinput', stub)
        })
        .type(' f\n{backspace}')
        .type('{moveToStart}{del}')
        .then(($el) => {
          const el = $el[0] as HTMLInputElement

          expect(stub).callCount(5)
          expect(el.value).eq('oo bar baz ')
        })
      })

      it('sends beforeinput in textarea', () => {
        const call1 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(' ')
          !isWebKit && expect(e.inputType).eq('insertText')
          stub.callsFake(call2)
        }
        const call2 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq('f')
          !isWebKit && expect(e.inputType).eq('insertText')
          stub.callsFake(call3)
        }
        const call3 = (e) => {
          expect(e.data).eq(null)
          !isWebKit && expect(e.inputType).eq('insertLineBreak')
          stub.callsFake(call4)
        }
        const call4 = (e) => {
          expect(e.data).eq(null)
          !isWebKit && expect(e.inputType).eq('deleteContentBackward')
          stub.callsFake(call5)
        }
        const call5 = (e) => {
          expect(e.data).eq(null)
          !isWebKit && expect(e.inputType).eq('deleteContentForward')
        }

        const stub = cy.stub()
        .callsFake(call1)

        cy.get('textarea:first')
        .then(($el) => {
          $el.val('foo bar baz')
          $el[0].addEventListener('beforeinput', stub)
        })
        .type(' f\n{backspace}')
        .type('{moveToStart}{del}')
        .then(($el) => {
          const el = $el[0] as HTMLTextAreaElement

          expect(stub).callCount(5)
          expect(el.value).eq('oo bar baz f')
        })
      })

      // In WebKit, simulated `beforeinput` events are not emitted for
      // contenteditable inputs. The stubs are receiving the
      // browser-emitted events, which is why the inputType values
      // of these events are populated.
      it('sends beforeinput in [contenteditable]', () => {
        const call1 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(' ')
          expect(e.inputType).eq('insertText')
          stub.callsFake(call2)
        }
        const call2 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq('f')
          expect(e.inputType).eq('insertText')
          stub.callsFake(call3)
        }
        const call3 = (e) => {
          expect(e.data).eq(null)
          expect(e.inputType).eq('insertParagraph')
          stub.callsFake(call4)
        }
        const call4 = (e) => {
          expect(e.data).eq(null)
          expect(e.inputType).eq('deleteContentBackward')
          stub.callsFake(call5)
        }
        const call5 = (e) => {
          expect(e.data).eq(null)

          if (isWebKit) {
            // WebKit does not distinguish between forward/backward
            // deletion within a contenteditable field
            expect(e.inputType).eq('deleteContentBackward')
          } else {
            expect(e.inputType).eq('deleteContentForward')
          }
        }

        const stub = cy.stub()
        .callsFake(call1)

        cy.get('#input-types [contenteditable]')
        .then(($el) => {
          $el.text('foo bar baz')
          $el[0].addEventListener('beforeinput', stub)
        })
        .type(' f\n{backspace}')
        .type('{moveToStart}{del}')
        .then(($el) => {
          expect(stub).callCount(5)
          expect($el[0].textContent).eq('oo bar baz f')
        })
      })

      it('beforeinput special inputTypes in [contenteditable] (not WebKit)', { browser: '!webkit' }, () => {
        const call1 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(null)
          expect(e.inputType).eq('deleteWordForward')
          stub.callsFake(call2)
        }
        const call2 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(null)
          expect(e.inputType).eq('deleteHardLineForward')
          stub.callsFake(call3)
        }
        const call3 = (e) => {
          expect(e.data).eq(null)
          expect(e.inputType).eq('deleteWordBackward')
          stub.callsFake(call4)
        }
        const call4 = (e) => {
          expect(e.data).eq(null)
          expect(e.inputType).eq('deleteHardLineBackward')
        }

        const stub = cy.stub()
        .callsFake(call1)

        cy.get('#input-types [contenteditable]')
        .then(($el) => {
          $el.text('foo bar baz')
          $el[0].addEventListener('beforeinput', stub)
        })
        .type('{ctrl}{del}')
        .type('{ctrl}{shift}{del}')
        .type('{ctrl}{backspace}')
        .type('{ctrl}{shift}{backspace}')
        .then(($el) => {
          expect(stub).callCount(4)
        })
      })

      // We do not emit simulated `beforeinput` events for the WebKit browser's
      // contenteditable fields, as `execCommand('insertText')` will emit `beforeinput`
      // when called. As a result, we do not emit as many events as other browsers in
      // this test case, which includes no-op deletions due to a terminal cursor position.
      it('beforeinput special inputTypes in [contenteditable] (WebKit)', { browser: 'webkit' }, () => {
        const call1 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(null)

          // WebKit does not distinguish between forward/backward
          // deletion within a contenteditable field using `execCommand('delete')`
          expect(e.inputType).eq('deleteContentBackward')

          stub.callsFake(call2)
        }
        const call2 = (e) => {
          expect(e.code).not.exist
          expect(e.data).eq(null)

          // WebKit does not distinguish between forward/backward
          // deletion within a contenteditable field using `execCommand('delete')`
          expect(e.inputType).eq('deleteContentBackward')
        }

        const stub = cy.stub()
        .callsFake(call1)

        cy.get('#input-types [contenteditable]')
        .then(($el) => {
          $el.text('foo bar baz')
          $el[0].addEventListener('beforeinput', stub)
        })
        // This command does not result in a change, as the cursor is in the right-most position
        // and there is nothing to delete. This causes WebKit to not emit a beforeinput event.
        .type('{ctrl}{del}')
        // This command also does not result in a change, for the same reason.
        .type('{ctrl}{shift}{del}')
        .type('{ctrl}{backspace}')
        .type('{ctrl}{shift}{backspace}')
        .then(($el) => {
          expect(stub).callCount(2)
        })
      })

      it('can cancel beforeinput', () => {
        let callCount = 0

        cy.get('input:first')
        .then(($el) => {
          $el.val('foo bar baz')
          $el[0].addEventListener('beforeinput', (e) => {
            callCount++
            e.preventDefault()
          })
        })
        .type('foo')
        .then(($el) => {
          const el = $el[0] as HTMLInputElement

          expect(callCount).eq(3)
          expect(el.value).eq('foo bar baz')
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

      // https://github.com/cypress-io/cypress/issues/5480
      it('does NOT follow focus if target is blurred without another receiving focus', () => {
        cy.$$('input:first').keydown(_.after(4, function () {
          this.blur()
        }))

        cy.get('input:first').type('foobar')
        .should('have.value', 'foobar')
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
        const events: any[] = []

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
        const events: any[] = []

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
        const events: any[] = []

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
        const events: any[] = []

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
        let mouseDownEvent: null | JQuery.MouseDownEvent = null
        let mouseUpEvent: null | JQuery.MouseUpEvent = null
        let clickEvent: null | JQuery.ClickEvent = null

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
          expect(mouseDownEvent?.metaKey).to.be.false
          expect(mouseDownEvent?.altKey).to.be.false

          expect(mouseUpEvent?.metaKey).to.be.false
          expect(mouseUpEvent?.altKey).to.be.false

          expect(clickEvent?.metaKey).to.be.false
          expect(clickEvent?.altKey).to.be.false

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
          const input = $el[0] as HTMLInputElement

          input.setSelectionRange(0, 3)
        })
        .type('{ctrl}')
        .should('have.value', '123')
      })

      // sends keyboard events for modifiers https://github.com/cypress-io/cypress/issues/3316
      it('sends keyup event for activated modifiers when typing is finished', (done) => {
        const $input = cy.$$('input:text:first')
        const events: any[] = []

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
        const events: any[] = []

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
        let mouseDownEvent: null | JQuery.MouseDownEvent = null
        let mouseUpEvent: null | JQuery.MouseUpEvent = null
        let clickEvent: null | JQuery.ClickEvent = null

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
          expect(mouseDownEvent?.metaKey).to.be.true
          expect(mouseDownEvent?.altKey).to.be.true

          expect(mouseUpEvent?.metaKey).to.be.true
          expect(mouseUpEvent?.altKey).to.be.true

          expect(clickEvent?.metaKey).to.be.true
          expect(clickEvent?.altKey).to.be.true

          done()
        })
      })

      it('resets modifiers before next test', () => {
        // this test will fail if you comment out
        // keyboard.resetModifiers

        const $input = cy.$$('input:text:first')
        const events: any[] = []

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

  // https://github.com/cypress-io/cypress/issues/5694
  describe('shortcuts', () => {
    beforeEach(function () {
      cy.visit('fixtures/dom.html')
      cy.on('log:added', (attrs, log) => {
        this.lastLog = log
      })
    })

    it('releases modifier keys at the end of the shortcut sequence', () => {
      cy.get(':text:first').type('h{ctrl+alt++}i')
      .then(function ($input) {
        const table = this.lastLog.invoke('consoleProps').table[2]()

        expect(table.name).to.eq('Keyboard Events')
        const expectedTable = [
          { 'Details': '{ code: KeyH, which: 72 }', Typed: 'h', 'Events Fired': `keydown, keypress, beforeinput, textInput, input, keyup`, 'Active Modifiers': null, 'Prevented Default': null, 'Target Element': $input[0] },
          { 'Details': '{ code: ControlLeft, which: 17 }', Typed: '{ctrl}', 'Events Fired': 'keydown', 'Active Modifiers': 'ctrl', 'Prevented Default': null, 'Target Element': $input[0] },
          { 'Details': '{ code: AltLeft, which: 18 }', Typed: '{alt}', 'Events Fired': 'keydown', 'Active Modifiers': 'alt, ctrl', 'Prevented Default': null, 'Target Element': $input[0] },
          { 'Details': '{ code: Equal, which: 187 }', Typed: '+', 'Events Fired': 'keydown, keyup', 'Active Modifiers': 'alt, ctrl', 'Prevented Default': null, 'Target Element': $input[0] },
          { 'Details': '{ code: AltLeft, which: 18 }', Typed: '{alt}', 'Events Fired': 'keyup', 'Active Modifiers': 'ctrl', 'Prevented Default': null, 'Target Element': $input[0] },
          { 'Details': '{ code: ControlLeft, which: 17 }', Typed: '{ctrl}', 'Events Fired': 'keyup', 'Active Modifiers': null, 'Prevented Default': null, 'Target Element': $input[0] },
          { 'Details': '{ code: KeyI, which: 73 }', Typed: 'i', 'Events Fired': `keydown, keypress, beforeinput, textInput, input, keyup`, 'Active Modifiers': null, 'Prevented Default': null, 'Target Element': $input[0] },
        ]

        // uncomment for debugging
        // _.each(table.data, (v, i) => expect(v).containSubset(expectedTable[i]))
        expect(table.data).to.deep.eq(expectedTable)
      })
    })

    it('can type a shortcut with special characters', () => {
      // NOTE: the default actions we implement will NOT be taken into account with modifiers
      // e.g. we do not the delete the entire word with ctrl+backspace
      // this matches the same behavior as cy.type('{ctrl}{backspace}')
      // TODO: maybe change this in the future, it's just more work
      cy.get(':text:first').type('foo{ctrl+backspace}bar')
      .should('have.value', 'fobar')
    })

    it('does not input text when non-shift modifier', () => {
      // NOTE: in this case the modifier DOES change the default action (when modifier other than Shift is applied, do not insert text)
      // since most users want to test a user issuing a shortcut, and it's simple for us to implement
      cy.get(':text:first').type('{ctrl+b}hi')
      .should('have.value', 'hi')
    })

    it('throws an error when a wrong modifier is given', () => {
      cy.on('fail', (err) => {
        expect(err.message).to.eq('`asdf` is not a modifier.')
      })

      cy.get(':text:first').type('{asdf+x}hi')
    })

    it('throws an error when shortcut is missing key', () => {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('{ctrl+}')
        expect(err.message).to.contain('is not recognized')
        expect(err.message).to.contain('alt, option, ctrl')
      })

      cy.get(':text:first').type('{ctrl+}hi')
    })
  })

  describe('case-insensitivity', () => {
    it('special chars are case-insensitive', () => {
      cy.get(':text:first').invoke('val', 'bar')
      cy.get(':text:first').type('{leftarrow}{DeL}').then(($input) => {
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

      cy.get('[contenteditable]:first').invoke('html', '<div><br></div>')
      cy.get('[contenteditable]:first').type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
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
    })

    it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.get('input:first').type('foobar', { log: false })
      .then(function () {
        const { lastLog, hiddenLog } = this

        expect(lastLog.get('name')).to.eq('get')
        expect(hiddenLog).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.get('input:first').type('foobar', { log: false })
      .then(function () {
        const { lastLog, hiddenLog } = this

        expect(lastLog.get('name')).to.eq('get')

        expect(hiddenLog).to.be.ok
        expect(hiddenLog.get('name'), 'log name').to.eq('type')
        expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
        expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
      })
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
        const txt = log.get('snapshots')[1].body.get().find('#comments')

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
        const txt = log.get('snapshots')[1].body.get().find('#comments')

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
      const logs: any[] = []
      const types: any[] = []

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

        expect(lastLog.invoke('consoleProps').props.Options).to.deep.eq({ force: true, timeout: 1000 })
      })
    })

    context('#consoleProps', () => {
      it('has all of the regular options', () => {
        cy.get('input:first').type('foobar').then(function ($input) {
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($input)
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.name).to.eq('type')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.Typed).to.eq('foobar')
          expect(consoleProps.props['Applied To']).to.eq($input.get(0))
          expect(consoleProps.props.Coords.x).to.be.closeTo(fromElWindow.x, 1)
          expect(consoleProps.props.Coords.y).to.be.closeTo(fromElWindow.y, 1)
        })
      })

      it('has a table of mouse events', () => {
        cy.get(':text:first').type('hi')
        .then(function ($input) {
          const table = this.lastLog.invoke('consoleProps').table[1]()

          expect(table).to.containSubset({
            'name': 'Mouse Events',
            'data': [
              { 'Event Type': 'pointerover' },
              { 'Event Type': 'mouseover' },
              { 'Event Type': 'pointermove' },
              { 'Event Type': 'pointerdown' },
              { 'Event Type': 'mousedown' },
              { 'Event Type': 'pointerover' },
              { 'Event Type': 'pointerup' },
              { 'Event Type': 'mouseup' },
              { 'Event Type': 'click' },
            ],
          })
        })
      })

      // Updated not to input text when non-shift modifier is pressed
      // https://github.com/cypress-io/cypress/issues/5424
      it('has a table of keyboard events', () => {
        cy.get(':text:first').type('{cmd}{option}foo{enter}b{leftarrow}{del}{enter}')
        .then(function ($input) {
          const table = this.lastLog.invoke('consoleProps').table[2]()

          expect(table.name).to.eq('Keyboard Events')
          const expectedTable = [
            { 'Details': '{ code: MetaLeft, which: 91 }', Typed: '{cmd}', 'Events Fired': 'keydown', 'Active Modifiers': 'meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: AltLeft, which: 18 }', Typed: '{option}', 'Events Fired': 'keydown', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: KeyF, which: 70 }', Typed: 'f', 'Events Fired': `keydown, keypress, beforeinput, textInput, input, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: KeyO, which: 79 }', Typed: 'o', 'Events Fired': `keydown, keypress, beforeinput, textInput, input, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: KeyO, which: 79 }', Typed: 'o', 'Events Fired': `keydown, keypress, beforeinput, textInput, input, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: Enter, which: 13 }', Typed: '{enter}', 'Events Fired': `keydown, keypress, beforeinput, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: KeyB, which: 66 }', Typed: 'b', 'Events Fired': `keydown, keypress, beforeinput, textInput, input, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: ArrowLeft, which: 37 }', Typed: '{leftarrow}', 'Events Fired': 'keydown, keyup', 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: Delete, which: 46 }', Typed: '{del}', 'Events Fired': `keydown, beforeinput, input, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: Enter, which: 13 }', Typed: '{enter}', 'Events Fired': `keydown, keypress, beforeinput, keyup`, 'Active Modifiers': 'alt, meta', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: MetaLeft, which: 91 }', Typed: '{cmd}', 'Events Fired': 'keyup', 'Active Modifiers': 'alt', 'Prevented Default': null, 'Target Element': $input[0] },
            { 'Details': '{ code: AltLeft, which: 18 }', Typed: '{option}', 'Events Fired': 'keyup', 'Active Modifiers': null, 'Prevented Default': null, 'Target Element': $input[0] },
          ]

          // uncomment for debugging
          expect(table.data).to.deep.eq(expectedTable)
          expect($input.val()).eq('foo')
        })
      })

      it('has no modifiers when there are none activated', () => {
        cy.get(':text:first').type('f').then(function ($el) {
          const table = this.lastLog.invoke('consoleProps').table[2]()

          expect(table.data).to.deep.eq([
            { Typed: 'f', 'Events Fired': 'keydown, keypress, beforeinput, textInput, input, keyup', 'Active Modifiers': null, Details: '{ code: KeyF, which: 70 }', 'Prevented Default': null, 'Target Element': $el[0] },
          ])
        })
      })

      it('has a table of keys with preventedDefault', () => {
        cy.$$(':text:first').keydown(() => {
          return false
        })

        cy.get(':text:first').type('f').then(function ($el) {
          const table = this.lastLog.invoke('consoleProps').table[2]()

          expect(table.data).to.deep.eq([
            { Typed: 'f', 'Events Fired': 'keydown, keyup', 'Active Modifiers': null, Details: '{ code: KeyF, which: 70 }', 'Prevented Default': true, 'Target Element': $el[0] },
          ])
        })
      })
    })
  })

  describe('user experience', () => {
    it('can print table of keys on click', () => {
      cy.get('input:first').type('foo')

      // @ts-expect-error - TODO: Not sure how to handle this
      const spyTableName = cy.spy(top.console, 'group')
      // @ts-expect-error - TODO: Not sure how to handle this
      const spyTableData = cy.spy(top.console, 'table')

      clickCommandLog('foo', 'message-text')
      .then(() => {
        expect(spyTableName.firstCall).calledWith('Mouse Events')
        expect(spyTableName.secondCall).calledWith('Keyboard Events')
        expect(spyTableData).calledTwice
      })
    })
  })

  describe('shadow dom', () => {
    beforeEach(() => {
      cy.visit('/fixtures/shadow-dom.html')
    })

    // https://github.com/cypress-io/cypress/issues/7741
    it('types into input', () => {
      cy
      .get('#shadow-element-1')
      .find('input', { includeShadowDom: true })
      .type('foo')
    })

    // https://github.com/cypress-io/cypress/issues/17531
    it('text events propagate out of shadow root', () => {
      cy.visit('fixtures/shadow-dom-type.html')

      cy
      .get('test-element').shadow()
      .find('input').type('asdf')

      cy.get('#result').should('have.text', 'typed')
    })

    // https://github.com/cypress-io/cypress/issues/26198
    it('type calls on elements in shadow dom do not fire click if the element already has focus', () => {
      cy.visit('fixtures/shadow-dom-type.html')

      cy.get('test-element').shadow().find('input').as('input')

      cy.get('@input').invoke('on', 'click', cy.spy().as('clickSpy'))
      cy.get('@input').focus().type('asdf')

      cy.get('@clickSpy').should('not.have.been.called')
    })
  })

  describe('{upArrow} and {downArrow}', () => {
    before(() => {
      cy.visit('fixtures/dom.html')
    })

    context('input[type=date]', () => {
      if (Cypress.isBrowser(['!webkit'])) {
        it('{upArrow} increases day by 1', () => {
          cy.get('#date-without-value').then(($input) => $input.val('2000-01-01'))
          cy.get('#date-without-value').type('{upArrow}')
          cy.get('#date-without-value').should('have.value', '2000-01-02')
        })

        it('{downArrow} decreases day by 1', () => {
          cy.get('#date-without-value').then(($input) => $input.val('2000-01-01'))
          cy.get('#date-without-value').type('{downArrow}')
          cy.get('#date-without-value').should('have.value', '1999-12-31')
        })

        it('{upArrow} triggers events on input', () => {
          cy.get('#date-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{upArrow}')

          cy.get('@spyInput').should('have.been.calledOnce')
          cy.get('@spyChange').should('have.been.calledOnce')
        })

        it('{downArrow} triggers events on input', () => {
          cy.get('#date-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{downArrow}')

          cy.get('@spyChange').should('have.been.calledOnce')
          cy.get('@spyInput').should('have.been.calledOnce')
        })
      }
    })

    context('input[type=month]', () => {
      // month inputs are not supported in Safari and Firefox: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month#browser_compatibility
      if (Cypress.isBrowser(['!webkit', '!firefox'])) {
        it('{upArrow} increases month by 1', () => {
          cy.get('#month-without-value').then(($input) => $input.val('2000-01'))
          cy.get('#month-without-value').type('{upArrow}')
          cy.get('#month-without-value').should('have.value', '2000-02')
        })

        it('{downArrow} decreases month by 1', () => {
          cy.get('#month-without-value').then(($input) => $input.val('2000-01'))
          cy.get('#month-without-value').type('{downArrow}')
          cy.get('#month-without-value').should('have.value', '1999-12')
        })

        it('{upArrow} triggers events on input', () => {
          cy.get('#month-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{upArrow}')

          cy.get('@spyInput').should('have.been.calledOnce')
          cy.get('@spyChange').should('have.been.calledOnce')
        })

        it('{downArrow} triggers events on input', () => {
          cy.get('#month-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{downArrow}')

          cy.get('@spyChange').should('have.been.calledOnce')
          cy.get('@spyInput').should('have.been.calledOnce')
        })
      }
    })

    context('input[type=week]', () => {
      // week inputs are not supported in Safari and Firefox: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week#browser_compatibility
      if (Cypress.isBrowser(['!webkit', '!firefox'])) {
        it('{upArrow} increases week by 1', () => {
          cy.get('#week-without-value').then(($input) => $input.val('2017-W05'))
          cy.get('#week-without-value').type('{upArrow}')
          cy.get('#week-without-value').should('have.value', '2017-W06')
        })

        it('{downArrow} decreases week by 1', () => {
          cy.get('#week-without-value').then(($input) => $input.val('2017-W05'))
          cy.get('#week-without-value').type('{downArrow}')
          cy.get('#week-without-value').should('have.value', '2017-W04')
        })

        it('{upArrow} triggers events on input', () => {
          cy.get('#week-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{upArrow}')

          cy.get('@spyInput').should('have.been.calledOnce')
          cy.get('@spyChange').should('have.been.calledOnce')
        })

        it('{downArrow} triggers events on input', () => {
          cy.get('#number-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{downArrow}')

          cy.get('@spyChange').should('have.been.calledOnce')
          cy.get('@spyInput').should('have.been.calledOnce')
        })
      }
    })

    context('input[type=time]', () => {
      // In Playwright Webkit implementation, these are shown as plain text input
      if (!isWebKit) {
        it('{upArrow} increases minute by 1', () => {
          cy.get('#time-without-value').then(($input) => $input.val('01:23'))
          cy.get('#time-without-value').type('{upArrow}')
          cy.get('#time-without-value').should('have.value', '01:24')
        })

        it('{downArrow} decreases minute by 1', () => {
          cy.get('#time-without-value').then(($input) => $input.val('01:23'))
          cy.get('#time-without-value').type('{downArrow}')
          cy.get('#time-without-value').should('have.value', '01:22')
        })

        it('{upArrow} triggers events on input', () => {
          cy.get('#time-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{upArrow}')

          cy.get('@spyInput').should('have.been.calledOnce')
          cy.get('@spyChange').should('have.been.calledOnce')
        })

        it('{downArrow} triggers events on input', () => {
          cy.get('#time-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{downArrow}')

          cy.get('@spyChange').should('have.been.calledOnce')
          cy.get('@spyInput').should('have.been.calledOnce')
        })
      }
    })

    context('input[type=datetime-local]', () => {
      // In Playwright Webkit implementation, these are shown as plain text input
      if (!isWebKit) {
        it('{upArrow} increases time value', () => {
          cy.get('#datetime-local-without-value').type('{upArrow}')
        })

        it('{downArrow} decreases time value', () => {
          cy.get('#datetime-local-without-value').type('{downArrow}')
        })

        it('{upArrow} triggers events on input', () => {
          cy.get('#datetime-local-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{upArrow}')

          cy.get('@spyInput').should('have.been.calledOnce')
          cy.get('@spyChange').should('have.been.calledOnce')
        })

        it('{downArrow} triggers events on input', () => {
          cy.get('#datetime-local-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{downArrow}')

          cy.get('@spyChange').should('have.been.calledOnce')
          cy.get('@spyInput').should('have.been.calledOnce')
        })
      }
    })

    context('input[type=number]', () => {
      it('{upArrow} increases number value', () => {
        cy.get('#number-without-value').then(($input) => $input.val(0))
        cy.get('#number-without-value').type('{upArrow}')
        cy.get('#number-without-value').should('have.value', 1)
      })

      it('{downArrow} decreases number value', () => {
        cy.get('#number-without-value').then(($input) => $input.val(1))
        cy.get('#number-without-value').type('{downArrow}')
        cy.get('#number-without-value').should('have.value', 0)
      })

      it('{upArrow} triggers events on input', () => {
        cy.get('#number-with-value')
        .then(($input) => {
          $input.on('change', cy.spy().as('spyChange'))
          $input.on('input', cy.spy().as('spyInput'))

          return $input
        })
        .type('{upArrow}')

        cy.get('@spyInput').should('have.been.calledOnce')
        cy.get('@spyChange').should('have.been.calledOnce')
      })

      it('{downArrow} triggers events on input', () => {
        cy.get('#number-with-value')
        .then(($input) => {
          $input.on('change', cy.spy().as('spyChange'))
          $input.on('input', cy.spy().as('spyInput'))

          return $input
        })
        .type('{downArrow}')

        cy.get('@spyChange').should('have.been.calledOnce')
        cy.get('@spyInput').should('have.been.calledOnce')
      })
    })

    context('input[type=range]', () => {
      if (!isWebKit) {
        it('{upArrow} increases value by 1', () => {
          cy.get('#range-without-value').then(($input) => $input.val(1))
          cy.get('#range-without-value').type('{upArrow}')
          cy.get('#range-without-value').should('have.value', 2)
        })

        it('{downArrow} decreases value by 1', () => {
          cy.get('#range-without-value').then(($input) => $input.val(1))
          cy.get('#range-without-value').type('{downArrow}')
          cy.get('#range-without-value').should('have.value', 0)
        })

        it('{upArrow} triggers events on input', () => {
          cy.get('#range-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{upArrow}')

          cy.get('@spyInput').should('have.been.calledOnce')
          cy.get('@spyChange').should('have.been.calledOnce')
        })

        it('{downArrow} triggers events on input', () => {
          cy.get('#range-with-value')
          .then(($input) => {
            $input.on('change', cy.spy().as('spyChange'))
            $input.on('input', cy.spy().as('spyInput'))

            return $input
          })
          .type('{downArrow}')

          cy.get('@spyChange').should('have.been.calledOnce')
          cy.get('@spyInput').should('have.been.calledOnce')
        })
      }
    })
  })
})
