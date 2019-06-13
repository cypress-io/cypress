/* eslint arrow-body-style: "off" */

import { trimInnerText, attachKeyListeners, shouldBeCalledOnce, shouldNotBeCalled } from './utils'
const $ = Cypress.$.bind(Cypress)
const { _ } = Cypress

export default function () {
  describe('value changing', function () {
    it('changes the elements value', () => {
      cy.get('#input-without-value').type('a').then(($text) => {
        expect($text).to.have.value('a')
      })
    }
    )

    it('changes the elements value for multiple keys', () => {
      cy.get('#input-without-value').type('foo').then(($text) => {
        expect($text).to.have.value('foo')
      })
    }
    )

    it('inserts text after existing text', () => {
      cy.get('#input-with-value').type(' bar').then(($text) => {
        expect($text).to.have.value('foo bar')
      })
    }
    )

    it('inserts text after existing text input by invoking val', () => {
      cy.get('#input-without-value').invoke('val', 'foo').type(' bar').then(($text) => {
        expect($text).to.have.value('foo bar')
      })
    }
    )

    it('overwrites text when currently has selection', () => {
      cy.get('#input-without-value').invoke('val', '0').then((el) => {
        return el.select()
      })

      cy.get('#input-without-value').type('50').then(($input) => {
        expect($input).to.have.value('50')
      })
    })

    it('overwrites text when selectAll in click handler', () => {
      return cy.$$('#input-without-value').val('0').click(function () {
        return $(this).select()
      })
    }
    )

    it('overwrites text when selectAll in mouseup handler', () => {
      return cy.$$('#input-without-value').val('0').mouseup(function () {
        return $(this).select()
      })
    }
    )

    it('overwrites text when selectAll in mouseup handler', () => {
      return cy.$$('#input-without-value').val('0').mouseup(function () {
        return $(this).select()
      })
    }
    )

    it('responsive to keydown handler', function () {
      cy.$$('#input-without-value').val('1234').keydown(function () {
        return $(this).get(0).setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('651234')
      })
    })

    it('responsive to keyup handler', function () {
      cy.$$('#input-without-value').val('1234').keyup(function () {
        return $(this).get(0).setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('612345')
      })
    })

    it('responsive to input handler', function () {
      cy.$$('#input-without-value').val('1234').keyup(function () {
        return $(this).get(0).setSelectionRange(0, 0)
      })

      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('612345')
      })
    })

    it('responsive to change handler', function () {
      cy.$$('#input-without-value').val('1234').change(function () {
        return $(this).get(0).setSelectionRange(0, 0)
      })

      //# no change event should be fired
      cy.get('#input-without-value').type('56').then(($input) => {
        expect($input).to.have.value('123456')
      })
    })

    it('automatically moves the caret to the end if value is changed', () => {
      cy.$$('#input-without-value').keypress((e) => {
        e.preventDefault()

        const key = String.fromCharCode(e.which)

        const $input = $(e.target)

        const val = $input.val()

        //# setting value updates cursor to the end of input
        return $input.val(`${val + key}-`)
      })

      cy.get('#input-without-value').type('foo').then(($input) => {
        expect($input).to.have.value('f-o-o-')
      })
    })

    it('automatically moves the caret to the end if value is changed asynchronously', () => {
      cy.$$('#input-without-value').keypress((e) => {

        const $input = $(e.target)

        return _.defer(() => {
          const val = $input.val()

          return $input.val(`${val}-`)
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

      cy.get('#input-without-value').type('foo')//, { simulated: false })
      .then(($text) => {
        expect($text).to.have.value('')
      })
    })

    it('does not fire input when textInput is preventedDefault', (done) => {
      cy.$$('#input-without-value').get(0).addEventListener('input', () => {
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
      }
      )

      it('can input decimal', () => {
        cy.get('#number-without-value').type('2.0').then(($input) => {
          expect($input).to.have.value('2.0')
        })
      }
      )

      it('can utilize {selectall}', () => {
        cy.get('#number-with-value').type('{selectall}99').then(($input) => {
          expect($input).to.have.value('99')
        })
      }
      )

      it('can utilize arrows', () => {
        cy.get('#number-with-value').type('{leftarrow}{leftarrow}{rightarrow}9').then(($input) => {
          expect($input).to.have.value('192')
        })
      }
      )

      it('inserts text after existing text ', () => {
        cy.get('#number-with-value').type('34').then(($text) => {
          expect($text).to.have.value('1234')
        })
      }
      )

      it('inserts text after existing text input by invoking val', () => {
        cy.get('#number-without-value').invoke('val', '12').type('34').then(($text) => {
          expect($text).to.have.value('1234')
        })
      }
      )

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
        .type('-aaa123.12', { simulated: true })
        .should('have.value', '-123.12')
      })

      it('can send key events but not insert text for non-numeric', () => {
        const input = cy.$$('#number-without-value')

        attachKeyListeners({ input })

        cy.get('#number-without-value')
        .type('a', { simulated: true })
        .should('have.value', '')
        .blur()

        cy.getAll('input', ['change']).each(shouldNotBeCalled)
        cy.getAll('input', ['keydown', 'keyup']).each(shouldBeCalledOnce)

      })

      it('type=number blurs consistently', () => {
        let blurred = 0

        cy.$$('#number-without-value').blur(() => {
          return blurred++
        })

        cy.get('#number-without-value')
        .type('200').blur()
        .then(() => {
          expect(blurred).to.eq(1)
        })
      })
    })

    describe('input[type=email]', () => {
      it('can change values', () => {
        cy.get('#email-without-value').type('brian@foo.com').then(($text) => {
          expect($text).to.have.value('brian@foo.com')
        })
      }
      )

      it('can utilize {selectall}', () => {
        cy.get('#email-with-value').type('{selectall}brian@foo.com').then(($text) => {
          expect($text).to.have.value('brian@foo.com')
        })
      }
      )

      it('can utilize arrows', () => {
        cy.get('#email-with-value').type('{leftarrow}{rightarrow}om').then(($text) => {
          expect($text).to.have.value('brian@foo.com')
        })
      }
      )

      it('inserts text after existing text', () => {
        cy.get('#email-with-value').type('om').then(($text) => {
          expect($text).to.have.value('brian@foo.com')
        })
      }
      )

      it('inserts text after existing text input by invoking val', () => {
        cy.get('#email-without-value').invoke('val', 'brian@foo.c').type('om').then(($text) => {
          expect($text).to.have.value('brian@foo.com')
        })
      }
      )

      it('overwrites text when input has existing text selected', () => {
        cy.get('#email-without-value').invoke('val', 'foo@bar.com').invoke('select')

        cy.get('#email-without-value').type('bar@foo.com').then(($input) => {
          expect($input).to.have.value('bar@foo.com')
        })
      })

      it('type=email blurs consistently', () => {
        let blurred = 0

        cy.$$('#email-without-value').blur(() => {
          return blurred++
        })

        cy.get('#email-without-value')
        .type('foo@bar.com').blur()
        .then(() => {
          expect(blurred).to.eq(1)
        })
      })
    })

    describe('input[type=password]', () => {
      it('can change values', () => {
        cy.get('#password-without-value').type('password').then(($text) => {
          expect($text).to.have.value('password')
        })
      }
      )

      it('inserts text after existing text', () => {
        cy.get('#password-with-value').type('word').then(($text) => {
          expect($text).to.have.value('password')
        })
      }
      )

      it('inserts text after existing text input by invoking val', () => {
        cy.get('#password-without-value').invoke('val', 'secr').type('et').then(($text) => {
          expect($text).to.have.value('secret')
        })
      }
      )

      it('overwrites text when input has existing text selected', () => {
        cy.get('#password-without-value').invoke('val', 'secret').invoke('select')

        cy.get('#password-without-value').type('agent').then(($input) => {
          expect($input).to.have.value('agent')
        })
      })

      it('overwrites text when input has selected range of text in click handler', () => {
        // e.preventDefault()
        cy.$$('#input-with-value').mouseup((e) => {
          return e.target.setSelectionRange(1, 1)
        }
        )

        const select = (e) => {
          return e.target.select()
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
      }
      )

      it('overwrites existing value', () => {
        cy.get('#date-with-value').type('1959-09-13').then(($text) => {
          expect($text).to.have.value('1959-09-13')
        })
      }
      )

      it('overwrites existing value input by invoking val', () => {
        cy.get('#date-without-value').invoke('val', '2016-01-01').type('1959-09-13').then(($text) => {
          expect($text).to.have.value('1959-09-13')
        })
      }
      )
    })

    describe('input[type=month]', () => {
      it('can change values', () => {
        cy.get('#month-without-value').type('1959-09').then(($text) => {
          expect($text).to.have.value('1959-09')
        })
      }
      )

      it('overwrites existing value', () => {
        cy.get('#month-with-value').type('1959-09').then(($text) => {
          expect($text).to.have.value('1959-09')
        })
      }
      )

      it('overwrites existing value input by invoking val', () => {
        cy.get('#month-without-value').invoke('val', '2016-01').type('1959-09').then(($text) => {
          expect($text).to.have.value('1959-09')
        })
      }
      )
    })

    describe('input[type=week]', () => {
      it('can change values', () => {
        cy.get('#week-without-value').type('1959-W09').then(($text) => {
          expect($text).to.have.value('1959-W09')
        })
      }
      )

      it('overwrites existing value', () => {
        cy.get('#week-with-value').type('1959-W09').then(($text) => {
          expect($text).to.have.value('1959-W09')
        })
      }
      )

      it('overwrites existing value input by invoking val', () => {
        cy.get('#week-without-value').invoke('val', '2016-W01').type('1959-W09').then(($text) => {
          expect($text).to.have.value('1959-W09')
        })
      }
      )
    })

    describe('input[type=time]', () => {
      it('can change values', () => {
        cy.get('#time-without-value').type('01:23:45').then(($text) => {
          expect($text).to.have.value('01:23:45')
        })
      }
      )

      it('overwrites existing value', () => {
        cy.get('#time-with-value').type('12:34:56').then(($text) => {
          expect($text).to.have.value('12:34:56')
        })
      }
      )

      it('overwrites existing value input by invoking val', () => {
        cy.get('#time-without-value').invoke('val', '01:23:45').type('12:34:56').then(($text) => {
          expect($text).to.have.value('12:34:56')
        })
      }
      )

      it('can be formatted HH:mm', () => {
        cy.get('#time-without-value').type('01:23').then(($text) => {
          expect($text).to.have.value('01:23')
        })
      }
      )

      it('can be formatted HH:mm:ss', () => {
        cy.get('#time-without-value').type('01:23:45').then(($text) => {
          expect($text).to.have.value('01:23:45')
        })
      }
      )

      it('can be formatted HH:mm:ss.S', () => {
        cy.get('#time-without-value').type('01:23:45.9').then(($text) => {
          expect($text).to.have.value('01:23:45.9')
        })
      }
      )

      it('can be formatted HH:mm:ss.SS', () => {
        cy.get('#time-without-value').type('01:23:45.99').then(($text) => {
          expect($text).to.have.value('01:23:45.99')
        })
      }
      )

      it('can be formatted HH:mm:ss.SSS', () => {
        cy.get('#time-without-value').type('01:23:45.999').then(($text) => {
          expect($text).to.have.value('01:23:45.999')
        })
      }
      )
    })

    describe('[contenteditable]', () => {
      it('can change values', () => {
        cy.get('#input-types [contenteditable]').type('foo').then(($div) => {
          expect($div).to.have.text('foo')
        })
      }
      )

      it('inserts text after existing text', () => {
        cy.get('#input-types [contenteditable]').invoke('text', 'foo').type(' bar').then(($text) => {
          expect($text).to.have.text('foo bar')
        })
      }
      )

      it('can type into [contenteditable] with existing <div>', () => {
        cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>foo</div>'

        cy.get('[contenteditable]:first')
        .type('bar')
        .then(($div) => {
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

      it('can remove a placeholder <br>', () => {
        cy.$$('[contenteditable]:first').get(0).innerHTML = '<div><br></div>'

        cy.get('[contenteditable]:first')
        .type('foobar').then(($div) => {
          expect($div.get(0).innerHTML).to.eql('<div>foobar</div>')
        })
      })

      it('can type into an iframe with designmode = \'on\'', () => {
        //# append a new iframe to the body
        cy.$$('<iframe id="generic-iframe" src="/fixtures/generic.html" style="height: 500px"></iframe>')
        .appendTo(cy.$$('body'))

        //# wait for iframe to load
        let loaded = false

        cy.get('#generic-iframe')
        .then(($iframe) => {
          return $iframe.load(() => {
            return loaded = true
          })
        }).scrollIntoView()
        .should(() => {
          expect(loaded).to.eq(true)
        })

        //# type text into iframe
        cy.get('#generic-iframe')
        .should(($iframe) => {
          $iframe[0].contentDocument.designMode = 'on'
        })
        .then(($iframe) => {
          const iframe = $iframe.contents()

          return cy.wrap(iframe.find('html')).first()
          // .should(($el) => {
          // $el.find('body').append(cy.$$('<input/>'))
          // })
          // .type('foo')
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

    //# TODO: fix this with 4.0 updates
    return describe.skip('element reference loss', () => {
      it('follows the focus of the cursor', () => {
        let charCount = 0

        cy.$$('input:first').keydown(() => {
          if (charCount === 3) {
            cy.$$('input').eq(1).focus()
          }

          return charCount++
        })

        cy.get('input:first').type('foobar').then(() => {
          cy.get('input:first').should('have.value', 'foo')

          cy.get('input').eq(1).should('have.value', 'bar')
        })
      })
    }
    )
  })
}
