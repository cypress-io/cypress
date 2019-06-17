import './hooks'
import { trimInnerText, attachKeyListeners, shouldNotBeCalled, shouldBeCalled } from './utils'

const { _ } = Cypress

describe('specialChars', function () {
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
      const keypress = cy.stub()
      .callsFake((e) => {
        expect(e.charCode).to.eq(123)
        expect(e.which).to.eq(123)
        expect(e.keyCode).to.eq(123)

        done()
      })

      cy.$$(':text:first').on('keypress', keypress)

      cy.get(':text:first').invoke('val', 'ab').type('{{}')
      .then(() => {
        expect(keypress).to.be.calledOnce
      })
    })

    it('fires textInput event with e.data', (done) => {
      cy.$$(':text:first').on('textInput', (e) => {
        expect(e.originalEvent.data).to.eq('{')

        done()
      })

      cy.get(':text:first').invoke('val', 'ab').type('{{}')
    })

    it('fires input event', (done) => {
      cy.$$(':text:first').on('input', () => {
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
      cy.$$(':text:first').on('textInput', () => {
        done('textInput should not have fired')
      })

      cy.get(':text:first').invoke('val', 'ab').type('{esc}')//, {simulated:false})
      .then(() => {
        done()
      })
    })

    it('does not fire input event', (done) => {
      cy.$$(':text:first').on('input', () => {
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
    }
    )

    it('can backspace a selection range of characters', () => {
      //# select the 'ar' characters
      return cy
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(1, 3)
      }).get(':text:first').type('{backspace}').then(($input) => {
        expect($input).to.have.value('b')
      })
    }
    )

    it('sets which and keyCode to 8 and does not fire keypress events', (done) => {
      cy.$$(':text:first').on('keypress', () => {
        done('should not have received keypress')
      })

      cy.$$(':text:first').on('keydown', _.after(2, (e) => {
        expect(e.which).to.eq(8)
        expect(e.keyCode).to.eq(8)
        expect(e.key).to.eq('Backspace')

        done()
      })
      )

      cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}{backspace}')
    })

    it('does not fire textInput event', (done) => {
      cy.$$(':text:first').on('textInput', () => {
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
    }
    )

    it('can delete a selection range of characters', () => {
      //# select the 'ar' characters
      return cy
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(1, 3)
      }).get(':text:first').type('{del}').then(($input) => {
        expect($input).to.have.value('b')
      })
    }
    )

    it('sets which and keyCode to 46 and does not fire keypress events', (done) => {
      cy.$$(':text:first').on('keypress', () => {
        done('should not have received keypress')
      })

      cy.$$(':text:first').on('keydown', _.after(2, (e) => {
        expect(e.which).to.eq(46)
        expect(e.keyCode).to.eq(46)
        expect(e.key).to.eq('Delete')

        done()
      })
      )

      cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}{del}')
    })

    it('does not fire textInput event', (done) => {
      cy.$$(':text:first').on('textInput', () => {
        done('textInput should not have fired')
      })

      cy.get(':text:first').invoke('val', 'ab').type('{del}').then(() => {
        done()
      })
    })

    it('does fire input event when value changes', (done) => {
      cy.$$(':text:first').on('input', () => {
        done()
      })

      //# select the 'a' characters
      return cy
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(0, 1)
      }).get(':text:first').type('{del}')
    })

    it('does not fire input event when value does not change', (done) => {
      cy.$$(':text:first').on('input', () => {
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
    }
    )

    it('does not move the cursor if already at bounds 0', () => {
      cy.get(':text:first').invoke('val', 'bar').type('{selectall}{leftarrow}n').then(($input) => {
        expect($input).to.have.value('nbar')
      })
    }
    )

    it('sets the cursor to the left bounds', () => {
      //# select the 'a' character
      return cy
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(1, 2)
      }).get(':text:first').type('{leftarrow}n').then(($input) => {
        expect($input).to.have.value('bnar')
      })
    }
    )

    it('sets the cursor to the very beginning', () => {
      //# select the 'a' character
      return cy
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(0, 1)
      }).get(':text:first').type('{leftarrow}n').then(($input) => {
        expect($input).to.have.value('nbar')
      })
    }
    )

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

      cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}').then(() => {
        done()
      })
    })

    it('does not fire textInput event', (done) => {
      cy.$$(':text:first').on('textInput', () => {
        done('textInput should not have fired')
      })

      cy.get(':text:first').invoke('val', 'ab').type('{leftarrow}').then(() => {
        done()
      })
    })

    it('does not fire input event', (done) => {
      cy.$$(':text:first').on('input', () => {
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
      //# select the beginning
      cy.get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(0, 0)
      }).get(':text:first').type('{rightarrow}n').then(($input) => {
        expect($input).to.have.value('bnar')
      })
    }
    )

    it('does not move the cursor if already at end of bounds', () => {
      cy.get(':text:first').invoke('val', 'bar').type('{selectall}{rightarrow}n').then(($input) => {
        expect($input).to.have.value('barn')
      })
    }
    )

    it('sets the cursor to the rights bounds', () => {
      return cy
      //# select the 'a' character
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.get(0).setSelectionRange(1, 2)
      }).get(':text:first').type('{rightarrow}n').then(($input) => {
        expect($input).to.have.value('banr')
      })
    }
    )

    it('sets the cursor to the very beginning', () => {
      return cy
      .get(':text:first').invoke('val', 'bar').focus().then(($input) => {
        return $input.select()
      }).get(':text:first').type('{leftarrow}n').then(($input) => {
        expect($input).to.have.value('nbar')
      })
    }
    )

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

      cy.get(':text:first').invoke('val', 'ab').type('{rightarrow}').then(() => {
        done()
      })
    })

    it('does not fire textInput event', (done) => {
      cy.$$(':text:first').on('textInput', () => {
        done('textInput should not have fired')
      })

      cy.get(':text:first').invoke('val', 'ab').type('{rightarrow}').then(() => {
        done()
      })
    })

    it('does not fire input event', (done) => {
      cy.$$(':text:first').on('input', () => {
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

  context('{uparrow}', () => {
    beforeEach(() => {
      return cy.$$('#comments').val('foo\nbar\nbaz')
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

      cy.get('#comments').type('{uparrow}').then(() => {
        done()
      })
    })

    it('does not fire textInput event', (done) => {
      cy.$$('#comments').on('textInput', () => {
        done('textInput should not have fired')
      })

      cy.get('#comments').type('{uparrow}').then(() => {
        done()
      })
    })

    it('does not fire input event', (done) => {
      cy.$$('#comments').on('input', () => {
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
      //# select 'bar'
      const line = cy.$$('[contenteditable]:first div:nth-child(1)').get(0)

      cy.document().then((doc) => {
        ce.focus()

        return doc.getSelection().selectAllChildren(line)
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
    }
    )
  })

  context('{downarrow}', () => {
    beforeEach(() => {
      return cy.$$('#comments').val('foo\nbar\nbaz')
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

      cy.get('#comments').type('{downarrow}').then(() => {
        done()
      })
    })

    it('does not fire textInput event', (done) => {
      cy.$$('#comments').on('textInput', () => {
        done('textInput should not have fired')
      })

      cy.get('#comments').type('{downarrow}').then(() => {
        done()
      })
    })

    it('does not fire input event', (done) => {
      cy.$$('#comments').on('input', () => {
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
    }
    )

    it('downarrow ignores current selection', () => {
      const ce = cy.$$('[contenteditable]:first').get(0)

      ce.innerHTML =
                                                                                                                                                                                                                                            '<div>foo</div>' +
                                                                                                                                                                                                                                            '<div>bar</div>' +
                                                                                                                                                                                                                                            '<div>baz</div>'
      //# select 'foo'
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
    }
    )

    it('can select all [contenteditable] and delete', () => {
      cy.get('#input-types [contenteditable]').invoke('text', '1234').type('{selectall}{del}').type('foo').then(($div) => {
        expect($div).to.have.text('foo')
      })
    }
    )
  })

  context('{selectall} then type something', () => {
    it('replaces the text', () => {
      cy.get('#input-with-value').type('{selectall}new').then(($text) => {
        expect($text).to.have.value('new')
      })
    }
    )
  }
  )

  context('{enter}', function () {
    describe('{enter} on form', function () {
      beforeEach(function () {
        this.$forms = cy.$$('#form-submits')
      })

      context('1 input, no \'submit\' elements', function () {
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
            events.push(`${cmd.get('name')}:start`)
          })

          this.$forms.find('#single-input').submit((e) => {
            e.preventDefault()

            events.push('submit')
          })

          cy.on('log:added', (attrs, log) => {
            const state = log.get('state')

            if (state === 'pending') {
              log.on('state:changed', (state) => {
                events.push(`${log.get('name')}:log:${state}`)
              })

              events.push(`${log.get('name')}:log:${state}`)
            }
          })

          cy.on('command:end', (cmd) => {
            events.push(`${cmd.get('name')}:end`)
          })

          cy.get('#single-input input').type('f{enter}').then(() => {
            expect(events).to.deep.eq(['get:start', 'get:log:pending', 'get:end', 'type:start', 'type:log:pending', 'submit', 'type:end', 'then:start'])
          })
        })

        it('triggers 2 form submit event', function () {
          let submits = 0

          this.$forms.find('#single-input').submit((e) => {
            e.preventDefault()
            submits += 1
          })

          cy.get('#single-input input').type('f{enter}{enter}').then(() => {
            expect(submits).to.eq(2)
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

      context('2 inputs, no \'submit\' elements', () => {
        it('does not trigger submit event', function (done) {

          cy.get('#no-buttons input:first').type('f').type('{enter}').then(() => {
            done()
          })
        })
      }
      )

      context('2 inputs, no \'submit\' elements but 1 button[type=button]', () => {
        it('does not trigger submit event', function (done) {

          cy.get('#one-button-type-button input:first').type('f').type('{enter}').then(() => {
            done()
          })
        })
      }
      )

      context('2 inputs, 1 \'submit\' element input[type=submit]', function () {
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

      context('2 inputs, 1 \'submit\' element button[type=submit]', function () {
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

      context('2 inputs, 1 \'submit\' element button', function () {
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

      context('2 inputs, 2 \'submit\' elements', function () {
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

      context('disabled default button', function () {
        beforeEach(function () {
          return this.$forms.find('#multiple-inputs-and-multiple-submits').find('button').prop('disabled', true)
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
    it('sets which and keyCode to 13 and prevents EOL insertion', (done) => {
      cy.$$('#input-types textarea').on('keypress', _.after(2, () => {
        done('should not have received keypress event')
      })
      )

      cy.$$('#input-types textarea').on('keydown', _.after(2, (e) => {
        expect(e.which).to.eq(13)
        expect(e.keyCode).to.eq(13)
        expect(e.key).to.eq('Enter')

        e.preventDefault()
      })
      )

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
      })
      )

      cy.get('#input-types textarea').invoke('val', 'foo').type('d{enter}').then(($textarea) => {
        expect($textarea).to.have.value('food')

        done()
      })
    })

    it('{enter} does not fire input/textInput event in input', () => {

      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab').type('{enter}')//, {simulated:false})
      cy.getAll('input', ['textInput', 'input']).each(shouldNotBeCalled)
    })

    it('{enter} does fire textInput event in textarea', () => {

      const input = cy.$$('textarea:first')

      attachKeyListeners({ input })

      cy.get('textarea:first').invoke('val', 'ab').type('{enter}')//, {simulated:false})
      cy.getAll('input', ['textInput', 'input']).each(shouldBeCalled)
    })

    it('does not fire input event', (done) => {
      cy.$$(':text:first').on('input', () => {
        done('input should not have fired')
      })

      cy.get(':text:first').invoke('val', 'ab').type('{enter}').then(() => {
        done()
      })
    })

    it('inserts new line into textarea', () => {
      cy.get('#input-types textarea').invoke('val', 'foo').type('bar{enter}baz{enter}quux').then(($textarea) => {
        expect($textarea).to.have.value('foobar\nbaz\nquux')
      })
    }
    )

    it('inserts new line into [contenteditable] ', () => {
      cy.get('#input-types [contenteditable]:first').invoke('text', 'foo')
      .type('bar{enter}baz{enter}{enter}{enter}quux').then(function ($div) {
        const conditionalNewLines = '\n\n'.repeat(this.multiplierNumNewLines)

        expect(trimInnerText($div)).to.eql(`foobar\nbaz${conditionalNewLines}\nquux`)
        expect($div.get(0).textContent).to.eql('foobarbazquux')

        expect($div.get(0).innerHTML).to.eql('foobar<div>baz</div><div><br></div><div><br></div><div>quux</div>')
      })
    }
    )

    it('inserts new line into [contenteditable] from midline', () => {
      cy.get('#input-types [contenteditable]:first').invoke('text', 'foo')
      .type('bar{leftarrow}{enter}baz{leftarrow}{enter}quux').then(($div) => {
        expect(trimInnerText($div)).to.eql('fooba\nba\nquuxzr')
        expect($div.get(0).textContent).to.eql('foobabaquuxzr')

        expect($div.get(0).innerHTML).to.eql('fooba<div>ba</div><div>quuxzr</div>')
      })
    }
    )
  })
})
