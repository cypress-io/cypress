const { _, $ } = Cypress

export default function () {
  describe('events', () => {
    it('receives keydown event', () => {
      const $txt = cy.$$(':text:first')

      const keydown = cy.spy((e) => {
        const obj = _.pick(e.originalEvent, 'altKey', 'bubbles', 'cancelable', 'charCode', 'ctrlKey', 'detail', 'keyCode', 'view', 'layerX', 'layerY', 'location', 'metaKey', 'pageX', 'pageY', 'repeat', 'shiftKey', 'type', 'which', 'key')

        expect(obj).to.containSubset({
          altKey: false,
          bubbles: true,
          cancelable: true,
          charCode: 0,
          ctrlKey: false,
          detail: 0,
          key: 'a',
          keyCode: 65,
          location: 0,
          metaKey: false,
          repeat: false,
          shiftKey: false,
          type: 'keydown',
          view: cy.state('window'),
          which: 65,
        })

      })
      .as('keydown')

      $txt.on('keydown', keydown)

      cy.get(':text:first').type('a')
      .then(() => {
        expect(keydown).to.be.calledOnce
      })
    })

    it('receives keypress event', () => {
      const $txt = cy.$$(':text:first')

      const keypress = cy.spy((e) => {
        const obj = _.pick(e.originalEvent, 'altKey', 'bubbles', 'cancelable', 'charCode', 'ctrlKey', 'detail', 'keyCode', 'view', 'layerX', 'layerY', 'location', 'metaKey', 'pageX', 'pageY', 'repeat', 'shiftKey', 'type', 'which', 'key')

        expect(obj).to.deep.eq({
          altKey: false,
          bubbles: true,
          cancelable: true,
          charCode: 97,
          ctrlKey: false,
          detail: 0,
          key: 'a',
          keyCode: 97,
          location: 0,
          metaKey: false,
          repeat: false,
          shiftKey: false,
          type: 'keypress',
          view: cy.state('window'),
          which: 97,
        })
      })
      .as('keypress')

      $txt.on('keypress', keypress)

      cy.get(':text:first').type('a')
      .then(() => {
        expect(keypress).to.be.calledOnce
      })
    })

    it('receives keyup event', (done) => {
      const $txt = cy.$$(':text:first')

      $txt.on('keyup', (e) => {
        const obj = _.pick(e.originalEvent, 'altKey', 'bubbles', 'cancelable', 'charCode', 'ctrlKey', 'detail', 'keyCode', 'view', 'layerX', 'layerY', 'location', 'metaKey', 'pageX', 'pageY', 'repeat', 'shiftKey', 'type', 'which', 'key')

        expect(obj).to.deep.eq({
          altKey: false,
          bubbles: true,
          cancelable: true,
          charCode: 0,
          ctrlKey: false,
          detail: 0,
          key: 'a',
          keyCode: 65,
          location: 0,
          metaKey: false,
          repeat: false,
          shiftKey: false,
          type: 'keyup',
          view: cy.state('window'),
          which: 65,
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
      let fired = false

      cy.$$(':text:first').on('input', () => {
        return fired = true
      })

      fired = false
      cy.get(':text:first')
      .invoke('val', 'bar')
      .type('{selectAll}{rightarrow}{backspace}')//, {simulated:false})
      .should('have.value', 'ba')
      .then(() => {
        expect(fired).to.eq(true)
      })

      fired = false
      cy.get(':text:first')
      .invoke('val', 'bar')
      .type('{selectAll}{leftarrow}{del}')
      .then(() => {
        expect(fired).to.eq(true)
      })

      cy.$$('[contenteditable]:first').on('input', () => {
        return fired = true
      })

      fired = false
      cy.get('[contenteditable]:first')
      .invoke('html', 'foobar')
      .type('{selectAll}{rightarrow}{backspace}')
      .then(() => {
        expect(fired).to.eq(true)
      })

      fired = false

      cy.get('[contenteditable]:first')
      .invoke('html', 'foobar')
      .type('{selectAll}{leftarrow}{del}')
      .then(() => {
        expect(fired).to.eq(true)
      })
    })

    it('does not fire input event when value does not change', () => {
      const input = cy.stub().as('input event')

      cy.$$(':text:first').on('input', input)

      cy.get(':text:first')
      .invoke('val', 'bar')
      // .wait(6000)
      .type('{selectAll}')//{rightarrow}{del}')
      .then(() => {
        expect(input).not.called
      })

      input.reset()
      cy.get(':text:first')
      .invoke('val', 'bar')
      .type('{selectAll}{leftarrow}{backspace}')
      .then(() => {
        expect(input).not.called
      })

      cy.$$('textarea:first').on('input', input)

      input.reset()
      cy.get('textarea:first')
      .invoke('val', 'bar')
      .type('{selectAll}{rightarrow}{del}')
      .then(() => {
        expect(input).not.called
      })

      input.reset()
      cy.get('textarea:first')
      .invoke('val', 'bar')
      .type('{selectAll}{leftarrow}{backspace}')
      .then(() => {
        expect(input).not.called
      })

      cy.$$('[contenteditable]:first').on('input', input)

      input.reset()
      cy.get('[contenteditable]:first')
      .invoke('html', 'foobar')
      .type('{selectAll}{rightarrow}{del}')
      .then(() => {
        expect(input).not.called
      })

      input.reset()
      cy.get('[contenteditable]:first')
      .invoke('html', 'foobar')
      .type('{selectAll}{leftarrow}{backspace}')
      .then(() => {
        expect(input).not.called
      })
    })

    describe('change events', () => {
      it('fires when enter is pressed and value has changed', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').type('bar{enter}').then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('fires twice when enter is pressed and then again after losing focus', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').type('bar{enter}baz').blur().then(() => {
          expect(changed).to.eq(2)
        })
      })

      it('fires when element loses focus due to another action (click)', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy
        .get(':text:first').type('foo').then(() => {
          expect(changed).to.eq(0)
        }).get('button:first').click().then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('fires when element loses focus due to another action (type)', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy
        .get(':text:first').type('foo').then(() => {
          expect(changed).to.eq(0)
        }).get('textarea:first').type('bar').then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('fires when element is directly blurred', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy
        .get(':text:first').type('foo').blur().then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('fires when element is tabbed away from')//, ->
      //   changed = 0

      //   cy.$$(":text:first").change ->
      //     changed += 1

      //   cy.get(":text:first").invoke("val", "foo").type("b{tab}").then ->
      //     expect(changed).to.eq 1

      it('does not fire twice if element is already in focus between type/type', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').type('f').type('o{enter}').then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('does not fire twice if element is already in focus between clear/type', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').clear().type('o{enter}').then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('does not fire twice if element is already in focus between click/type', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').click().type('o{enter}').then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('does not fire twice if element is already in focus between type/click', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').type('d{enter}').click().then(() => {
          expect(changed).to.eq(1)
        })
      })

      it('does not fire at all between clear/type/click', () => {
        const change = cy.stub().as('change')

        cy.$$(':text:first').on('change', change)

        cy.get(':text:first').invoke('val', 'foo').clear().type('o').click().then(($el) => {
          expect(change).callCount(0)

          return $el
        }).blur()
        .then(() => {
          expect(change).callCount(1)
        })
      })

      it('does not fire if {enter} is preventedDefault', () => {
        let changed = 0

        cy.$$(':text:first').keypress((e) => {
          if (e.which === 13) {
            e.preventDefault()
          }
        })

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').type('b{enter}').then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire when enter is pressed and value hasnt changed', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.get(':text:first').invoke('val', 'foo').type('b{backspace}{enter}').then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire at the end of the type', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy
        .get(':text:first').type('foo').then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire change event if value hasnt actually changed', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy
        .get(':text:first').invoke('val', 'foo').type('{backspace}{backspace}oo{enter}').blur().then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire if mousedown is preventedDefault which prevents element from losing focus', () => {
        let changed = 0

        cy.$$(':text:first').change(() => {
          return changed += 1
        })

        cy.$$('textarea:first').mousedown(() => {
          return false
        })

        cy
        .get(':text:first').invoke('val', 'foo').type('bar')
        .get('textarea:first').click().then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire hitting {enter} inside of a textarea', () => {
        let changed = 0

        cy.$$('textarea:first').change(() => {
          return changed += 1
        })

        cy
        .get('textarea:first').type('foo{enter}bar').then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire hitting {enter} inside of [contenteditable]', () => {
        let changed = 0

        cy.$$('[contenteditable]:first').change(() => {
          return changed += 1
        })

        cy
        .get('[contenteditable]:first').type('foo{enter}bar').then(() => {
          expect(changed).to.eq(0)
        })
      })

      //# [contenteditable] does not fire ANY change events ever.
      it('does not fire at ALL for [contenteditable]', () => {
        let changed = 0

        cy.$$('[contenteditable]:first').change(() => {
          return changed += 1
        })

        cy
        .get('[contenteditable]:first').type('foo')
        .get('button:first').click().then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('does not fire on .clear() without blur', () => {
        let changed = 0

        cy.$$('input:first').change(() => {
          return changed += 1
        })

        cy.get('input:first').invoke('val', 'foo')
        .clear()
        .then(($el) => {
          expect(changed).to.eq(0)

          return $el
        }).type('foo')
        .blur()
        .then(() => {
          expect(changed).to.eq(0)
        })
      })

      it('fires change for single value change inputs', () => {
        let changed = 0

        cy.$$('input[type="date"]:first').change(() => {
          return changed++
        })

        cy.get('input[type="date"]:first')
        .type('1959-09-13')
        .blur()
        .then(() => {
          expect(changed).to.eql(1)
        })
      })

      it('does not fire change for non-change single value input', () => {
        let changed = 0

        cy.$$('input[type="date"]:first').change(() => {
          return changed++
        })

        cy.get('input[type="date"]:first')
        .invoke('val', '1959-09-13')
        .type('1959-09-13')
        .blur()
        .then(() => {
          expect(changed).to.eql(0)
        })
      })

      it('does not fire change for type\'d change that restores value', () => {
        let changed = 0

        cy.$$('input:first').change(() => {
          return changed++
        })

        cy.get('input:first')
        .invoke('val', 'foo')
        .type('{backspace}o')
        .invoke('val', 'bar')
        .type('{backspace}r')
        .blur()
        .then(() => {
          expect(changed).to.eql(0)
        })
      })
    })
    describe.skip('click events', () => {
      it('passes timeout and interval down to click', (done) => {
        $('<input />').attr('id', 'input-covered-in-span').prependTo(cy.$$('body'))

        cy.on('command:retry', (options) => {
          expect(options.timeout).to.eq(1000)
          expect(options.interval).to.eq(60)

          done()
        })

        cy.get('#input-covered-in-span').type('foobar', { timeout: 1000, interval: 60 })
      })

      it('does not issue another click event between type/type', () => {
        let clicked = 0

        cy.$$(':text:first').click(() => {
          return clicked += 1
        })

        cy.get(':text:first').type('f').type('o').then(() => {
          expect(clicked).to.eq(1)
        })
      })

      it('does not issue another click event if element is already in focus from click', () => {
        let clicked = 0

        cy.$$(':text:first').click(() => {
          return clicked += 1
        })

        cy.get(':text:first').click().type('o').then(() => {
          expect(clicked).to.eq(1)
        })
      })
    })
  })

}
