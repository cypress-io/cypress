const { _ } = Cypress
const {
  attachKeyListeners,
  shouldBeCalledOnce,
  shouldNotBeCalled,
  trimInnerText,
} = require('../../../support/utils')

describe('src/cy/commands/actions/type - #type special chars', () => {
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
      .get(':text:first').invoke('val', 'bar')
      .focus()
      .should(($input) => {
        $input.get(0).setSelectionRange(1, 3)
      })
      .type('{backspace}')
      .should('have.value', 'b')
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

    it('correct events in input', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab')
      .focus()
      .type('{backspace}')
      .should('have.value', 'a')

      cy.getAll('input', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in input with selection', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab')
      .focus()
      .type('{selectall}{backspace}')
      .should('have.value', '')

      cy.getAll('input', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in input when noop', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab')
      .then(($input) => $input[0].setSelectionRange(0, 0))
      .focus()
      .type('{backspace}')
      .should('have.value', 'ab')

      cy.getAll('input', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput input').each(shouldNotBeCalled)
    })

    it('correct events in textarea', () => {
      const textarea = cy.$$('textarea:first')

      attachKeyListeners({ textarea })

      cy.get('textarea:first').invoke('val', 'ab')
      .focus()
      .type('{backspace}')
      .should('have.value', 'a')

      cy.getAll('textarea', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('textarea', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in textarea with selection', () => {
      const textarea = cy.$$('textarea:first')

      attachKeyListeners({ textarea })

      cy.get('textarea:first').invoke('val', 'ab')
      .focus()
      .type('{selectall}{backspace}')
      .should('have.value', '')

      cy.getAll('textarea', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('textarea', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in textarea when noop', () => {
      const input = cy.$$('textarea:first')

      attachKeyListeners({ input })

      cy.get('textarea:first').invoke('val', 'ab')
      .then(($textarea) => $textarea[0].setSelectionRange(0, 0))
      .focus()
      .type('{backspace}')
      .should('have.value', 'ab')

      cy.getAll('input', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput input').each(shouldNotBeCalled)
    })

    it('correct events in contenteditable', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first').invoke('text', 'ab')
      .scrollIntoView()
      .type('{backspace}')
      .should('have.text', 'a')

      cy.getAll('ce', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('ce', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in contenteditable with selection', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first').invoke('text', 'ab')
      .scrollIntoView()
      .type('{moveToEnd}')
      .then(($el) => {
        $el[0].ownerDocument.getSelection().modify('extend', 'backward', 'character')
      })
      .type('{backspace}')
      .should('have.text', 'a')

      cy.getAll('ce', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('ce', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in contenteditable when noop', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first').invoke('text', 'ab')
      .focus()
      .type('{backspace}')
      .should('have.text', 'ab')

      cy.getAll('ce', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('ce', 'keypress textInput input').each(shouldNotBeCalled)
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

    it('correct events in input', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab')

      .then(($input) => $input[0].setSelectionRange(0, 0))
      .focus()
      .type('{del}')
      .should('have.value', 'b')

      cy.getAll('input', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in input with selection', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab')

      .then(($input) => $input[0].setSelectionRange(0, 0))
      .focus()
      .type('{selectall}{del}')
      .should('have.value', '')

      cy.getAll('input', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in input when noop', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first').invoke('val', 'ab')
      .focus()
      .type('{del}')
      .should('have.value', 'ab')

      cy.getAll('input', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput input').each(shouldNotBeCalled)
    })

    it('correct events in textarea', () => {
      const textarea = cy.$$('textarea:first')

      attachKeyListeners({ textarea })

      cy.get('textarea:first').invoke('val', 'ab')
      .then(($textarea) => $textarea[0].setSelectionRange(0, 0))
      .focus()
      .type('{del}')
      .should('have.value', 'b')

      cy.getAll('textarea', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('textarea', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in textarea with selection', () => {
      const textarea = cy.$$('textarea:first')

      attachKeyListeners({ textarea })

      cy.get('textarea:first').invoke('val', 'ab')
      .then(($textarea) => $textarea[0].setSelectionRange(0, 0))
      .focus()
      .type('{selectall}{del}')
      .should('have.value', '')

      cy.getAll('textarea', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('textarea', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in textarea when noop', () => {
      const input = cy.$$('textarea:first')

      attachKeyListeners({ input })

      cy.get('textarea:first').invoke('val', 'ab')
      .scrollIntoView()
      .type('{del}')
      .should('have.value', 'ab')

      cy.getAll('input', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput input').each(shouldNotBeCalled)
    })

    it('correct events in contenteditable', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first').invoke('text', 'ab')
      .focus()
      .type('{del}')
      .should('have.text', 'b')

      cy.getAll('ce', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('ce', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in contenteditable with selection', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first').invoke('text', 'ab')
      .type('{moveToStart}')
      .then(($el) => {
        $el[0].ownerDocument.getSelection().modify('extend', 'forward', 'character')
      })
      .type('{del}')
      .should('have.text', 'b')

      cy.getAll('ce', 'keydown input keyup').each(shouldBeCalledOnce)
      cy.getAll('ce', 'keypress textInput').each(shouldNotBeCalled)
    })

    it('correct events in contenteditable when noop', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first').invoke('text', 'ab')
      .scrollIntoView()
      .type('{del}')
      .should('have.text', 'ab')

      cy.getAll('ce', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('ce', 'keypress textInput input').each(shouldNotBeCalled)
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
      .type('{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33')
      .then(($div) => {
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
      .type('{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33')
      .should('have.value', 'foo22\nb11ar\nbaz33')
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
        if (Cypress.isBrowser('firefox')) {
          expect(trimInnerText($div)).to.eq('foo22\nbar\nbaz')

          return
        }

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
    beforeEach(() => {
      this.$forms = cy.$$('#form-submits')
    })

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

    it('{enter} correct events in input', () => {
      const input = cy.$$(':text:first')

      attachKeyListeners({ input })

      cy.get(':text:first')
      .invoke('val', 'ab')
      .type('{enter}')
      .should('have.value', 'ab')

      cy.getAll('input', 'keydown keypress keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'textInput input').each(shouldNotBeCalled)
    })

    it('{enter} correct events in [contenteditable]', () => {
      const ce = cy.$$('[contenteditable]:first')

      attachKeyListeners({ ce })

      cy.get('[contenteditable]:first')
      .focus()
      .invoke('val', 'ab')
      .type('{enter}')
      .should('have.value', 'ab')

      cy.getAll('ce', 'keydown keypress keyup input textInput').each(shouldBeCalledOnce)
    })

    it('{enter} correct events in textarea', () => {
      const input = cy.$$('textarea:first')

      attachKeyListeners({ input })

      cy.get('textarea:first')
      .invoke('val', 'foo')
      .scrollIntoView()
      .type('{enter}')
      .should('have.value', 'foo\n')

      cy.getAll('input', 'keydown keyup keypress input textInput').each(shouldBeCalledOnce)
    })

    it('{enter} correct events in textarea when preventDefault', () => {
      const input = cy.$$('textarea:first')

      attachKeyListeners({ input })

      input.on('keydown', (e) => {
        if (e.key === 'Enter') {
          e.stopPropagation()
          e.preventDefault()
        }
      })

      cy.get('textarea:first')
      .invoke('val', 'foo')
      .scrollIntoView()
      .type('{enter}')
      .should('have.value', 'foo')

      cy.getAll('input', 'keydown keyup').each(shouldBeCalledOnce)
      cy.getAll('input', 'keypress textInput input').each(shouldNotBeCalled)
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

        if (Cypress.isBrowser('firefox')) {
          expect(trimInnerText($div)).to.eql(`foobar\nbaz\n\n\nquux`)
          expect($div.get(0).textContent).to.eql('foobarbazquux')

          return
        }

        expect(trimInnerText($div)).to.equal(`foobar\nbaz${conditionalNewLines}\nquux`)
        expect($div.get(0).textContent).to.equal('foobarbazquux')
      })
    })

    it('inserts new line into [contenteditable] from midline', () => {
      cy.get('#input-types [contenteditable]:first').invoke('text', 'foo')
      .type('bar{leftarrow}{enter}baz{leftarrow}{enter}quux').then(($div) => {
        expect(trimInnerText($div)).to.eql('fooba\nba\nquuxzr')
        expect($div.get(0).textContent).to.eql('foobabaquuxzr')
      })
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

      it('triggers form submit synchronously before type logs or resolves', () => {
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

      it('triggers 2 form submit event', () => {
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
      it('does submit event', () => {
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
      it('triggers form submit', () => {
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
      beforeEach(() => {
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
