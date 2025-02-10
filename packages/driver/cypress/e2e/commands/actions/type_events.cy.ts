// @ts-expect-error - redeclared variable needs to be handled
const { _, $ } = Cypress

describe('src/cy/commands/actions/type - #type events', () => {
  beforeEach(() => {
    cy.visit('fixtures/dom.html')
  })

  describe('keyboard events', () => {
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
        .not.have.property('inputType')

        done()
      })

      cy.get(':text:first').type('a')
    })

    // TODO: fix this test in Webkit https://github.com/cypress-io/cypress/issues/26438
    it('receives textInput event', { browser: '!webkit' }, (done) => {
      const $txt = cy.$$(':text:first')

      $txt[0].addEventListener('textInput', (e) => {
        const textInputEvent = e as UIEvent

        // FIXME: (firefox) firefox cannot access window objects else throw cross-origin error
        expect(Object.prototype.toString.call(textInputEvent.view)).eq('[object Window]')
        // @ts-expect-error - TODO: view is readonly and should not be assigned
        textInputEvent.view = null
        expect(_.toPlainObject(textInputEvent)).to.include({
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

    // https://github.com/cypress-io/cypress/issues/20283
    // TODO: Implement tests below.
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

  describe('click events', () => {
    it('passes timeout and interval down to click', (done) => {
      const input = $('<input />').attr('id', 'input-covered-in-span').prependTo(cy.$$('body'))

      $('<span>span on input</span>')
      .css('position', 'absolute')
      .css('left', `${input.offset()?.left}`)
      .css('top', `${input.offset()?.top}`)
      .css('padding', '5px')
      .css('display', 'inline-block')
      .css('backgroundColor', 'yellow')
      .prependTo(cy.$$('body'))

      cy.on('command:retry', (options) => {
        expect(options.timeout).to.eq(1000)
        expect(options.interval).to.eq(60)

        done()
      })

      // @ts-expect-error - TODO: This should see the InternalTypeOptions type
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

    // https://github.com/cypress-io/cypress/issues/20283
    // TODO: implement this test
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

    it('does not fire when enter is pressed and value has not changed', () => {
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

  // https://github.com/cypress-io/cypress/issues/19541
  describe(`type('{enter}') and click event on button-like elements`, () => {
    beforeEach(() => {
      cy.visit('fixtures/click-event-by-type.html')
    })

    describe('triggers', () => {
      const targets = [
        'button-tag',
        'input-button',
        'input-image',
        'input-reset',
        'input-submit',
      ]

      targets.forEach((target) => {
        // TODO fix this test in Webkit https://github.com/cypress-io/cypress/issues/26438
        it(target, { browser: '!webkit' }, () => {
          cy.get(`#target-${target}`).focus().type('{enter}')

          cy.get('li').should('have.length', 4)
          cy.get('li').eq(0).should('have.text', 'keydown')
          cy.get('li').eq(1).should('have.text', 'keypress')
          cy.get('li').eq(2).should('have.text', 'click')
          cy.get('li').eq(3).should('have.text', 'keyup')
        })
      })

      describe('keydown triggered on another element', () => {
        targets.forEach((target) => {
          // TODO fix this test in Webkit https://github.com/cypress-io/cypress/issues/26438
          it(target, { browser: '!webkit' }, () => {
            cy.get('#focus-options').select(target)
            cy.get('#input-text').focus().type('{enter}')

            cy.get('li').should('have.length', 3)
            cy.get('li').eq(0).should('have.text', 'keypress')
            cy.get('li').eq(1).should('have.text', 'click')
            cy.get('li').eq(2).should('have.text', 'keyup')
          })
        })
      })
    })

    describe('does not trigger', () => {
      const targets = [
        'input-checkbox',
        'input-radio',
      ]

      targets.forEach((target) => {
        it(target, () => {
          cy.get(`#target-${target}`).focus().type('{enter}')

          cy.get('li').should('have.length', 3)
          cy.get('li').eq(0).should('have.text', 'keydown')
          cy.get('li').eq(1).should('have.text', 'keypress')
          cy.get('li').eq(2).should('have.text', 'keyup')
        })
      })

      describe('keydown triggered on another element', () => {
        targets.forEach((target) => {
          it(target, () => {
            cy.get('#focus-options').select(target)
            cy.get('#input-text').focus().type('{enter}')

            cy.get('li').should('have.length', 2)
            cy.get('li').eq(0).should('have.text', 'keypress')
            cy.get('li').eq(1).should('have.text', 'keyup')
          })
        })
      })
    })

    describe('shadow dom', () => {
      // https://github.com/cypress-io/cypress/issues/26392
      it('propagates through shadow roots', () => {
        cy.visit('fixtures/shadow-dom-button.html')

        cy.get('cy-test-element').invoke('on', 'click', cy.spy().as('clickSpy'))

        cy.get('cy-test-element').shadow().find('button').focus().type('{enter}')

        cy.get('@clickSpy').should('have.been.called')
      })
    })
  })

  describe(`type(' ') fires click event on button-like elements`, () => {
    beforeEach(() => {
      cy.visit('fixtures/click-event-by-type.html')
    })

    const targets = [
      '#target-button-tag',
      '#target-input-button',
      '#target-input-image',
      '#target-input-reset',
      '#target-input-submit',
    ]

    describe(`triggers with single space`, () => {
      targets.forEach((target) => {
        it(target, () => {
          const events: any[] = []

          $(target).on('keydown keypress keyup click', (evt) => {
            events.push(evt.type)
          })

          cy.get(target).focus().type(' ').then(() => {
            expect(events).to.deep.eq([
              'keydown',
              'keypress',
              'keyup',
              'click',
            ])
          })

          cy.get('li').eq(0).should('have.text', 'keydown')
          cy.get('li').eq(1).should('have.text', 'keypress')
          cy.get('li').eq(2).should('have.text', 'keyup')
          cy.get('li').eq(3).should('have.text', 'click')
        })
      })
    })

    describe(`does not trigger if keyup prevented`, () => {
      targets.forEach((target) => {
        it(`${target} does not fire click event`, () => {
          const events: any[] = []

          $(target)
          .on('keydown keypress keyup click', (evt) => {
            events.push(evt.type)
          })
          .on('keyup', (evt) => {
            evt.preventDefault()
          })

          cy.get(target).focus().type(' ').then(() => {
            expect(events).to.deep.eq([
              'keydown',
              'keypress',
              'keyup',
            ])
          })

          cy.get('li').should('have.length', 3)
          cy.get('li').eq(0).should('have.text', 'keydown')
          cy.get('li').eq(1).should('have.text', 'keypress')
          cy.get('li').eq(2).should('have.text', 'keyup')
        })
      })
    })

    describe('triggers after other characters', () => {
      targets.forEach((target) => {
        it(target, () => {
          const events: any[] = []

          $(target).on('keydown keypress keyup click', (evt) => {
            events.push(evt.type)
          })

          cy.get(target).focus().type('asd ').then(() => {
            expect(events).to.deep.eq([
              'keydown',
              'keypress',
              'keyup',
              'keydown',
              'keypress',
              'keyup',
              'keydown',
              'keypress',
              'keyup',
              'keydown',
              'keypress',
              'keyup',
              'click',
            ])
          })

          cy.get('li').eq(12).should('have.text', 'click')
        })
      })
    })

    describe('checkbox', () => {
      it('checkbox is checked/unchecked', () => {
        cy.get(`#target-input-checkbox`).focus().type(' ')

        cy.get('li').eq(0).should('have.text', 'keydown')
        cy.get('li').eq(1).should('have.text', 'keypress')
        cy.get('li').eq(2).should('have.text', 'keyup')
        cy.get('li').eq(3).should('have.text', 'click')

        cy.get('#target-input-checkbox').should('be.checked')

        cy.get(`#target-input-checkbox`).type(' ')

        cy.get('li').eq(4).should('have.text', 'keydown')
        cy.get('li').eq(5).should('have.text', 'keypress')
        cy.get('li').eq(6).should('have.text', 'keyup')
        cy.get('li').eq(7).should('have.text', 'click')

        cy.get('#target-input-checkbox').should('not.be.checked')
      })
    })

    describe('radio', () => {
      it('radio fires click event when it is not checked', () => {
        cy.get(`#target-input-radio`).focus().type(' ')

        cy.get('li').eq(0).should('have.text', 'keydown')
        cy.get('li').eq(1).should('have.text', 'keypress')
        cy.get('li').eq(2).should('have.text', 'keyup')
        cy.get('li').eq(3).should('have.text', 'click')

        cy.get('#target-input-radio').should('be.checked')
      })

      it('radio does not fire click event when it is checked', () => {
        // We're clicking here first to make the radio element checked.
        cy.get(`#target-input-radio`).click().type(' ')

        // item 0 is click event. It's fired because we want to make sure our radio button is checked.
        cy.get('li').eq(1).should('have.text', 'keydown')
        cy.get('li').eq(2).should('have.text', 'keypress')
        cy.get('li').eq(3).should('have.text', 'keyup')

        cy.get('#target-input-radio').should('be.checked')
      })
    })

    describe('keydown on another element does not trigger click', () => {
      const targets = [
        'button-tag',
        'input-button',
        'input-image',
        'input-reset',
        'input-submit',
        'input-checkbox',
        'input-radio',
      ]

      targets.forEach((target) => {
        it(target, () => {
          cy.get('#focus-options').select('button-tag')
          cy.get('#input-text').focus().type(' ')

          cy.get('li').should('have.length', 2)
          cy.get('li').eq(0).should('have.text', 'keypress')
          cy.get('li').eq(1).should('have.text', 'keyup')
        })
      })
    })
  })
})
