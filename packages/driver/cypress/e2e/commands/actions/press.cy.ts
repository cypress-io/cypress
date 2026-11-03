describe('src/cy/commands/actions/press', () => {
  // TODO: Webkit is not supported. https://github.com/cypress-io/cypress/issues/31054
  if (Cypress.isBrowser('webkit')) {
    return
  }

  beforeEach(() => {
    cy.visit('/fixtures/input_events.html')
  })

  it('fires the click event on the button when the named key for Space is sent', () => {
    cy.get('#button').focus()
    cy.get('#button').should('be.focused')
    cy.press(Cypress.Keyboard.Keys.SPACE)
    cy.get('#checkbox').should('be.checked')
  })

  it('fires the click event on the button when a space is sent', () => {
    cy.get('#button').focus()
    cy.get('#button').should('be.focused')
    cy.press(' ')
    cy.get('#checkbox').should('be.checked')
  })

  const testKeyDownUp = (key) => {
    it(`dispatches ${key} keypress to the AUT`, () => {
      cy.press(key)
      // spacebar is a special case - it's both a named key and a single character,
      // but when we dispatch the named key (via codepoint in bidi, via `Space` in CDP)
      // we get the space character, not the name of the key.
      cy.get('#keydown').should('have.value', key === 'Space' ? ' ' : key)
    })
  }

  describe('key event fidelity', () => {
    beforeEach(() => {
      cy.visit('/fixtures/press_fidelity.html')
    })

    it('submits a form implicitly when Enter is pressed in a text field', () => {
      cy.get('#form-input').focus()
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.window().its('submits').should('eq', 1)
    })

    // https://github.com/cypress-io/cypress/issues/32452
    it('adds a newline to a textarea when Enter is pressed', () => {
      cy.get('#textarea').focus()
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.get('#textarea').should('have.value', '\n')
    })

    it('starts a new line in a contenteditable element when Enter is pressed', () => {
      cy.get('#contenteditable').focus()
      cy.press('a')
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.press('b')
      cy.get('#contenteditable').should(($el) => {
        expect($el[0].innerText).to.eq('a\nb')
      })
    })

    it('fires keypress for Enter', () => {
      cy.get('#textarea').focus()
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.window().its('keypresses').should('deep.equal', [{ key: 'Enter', keyCode: 13 }])
    })

    const expectedKeydowns = [
      { press: 'a', key: 'a', code: 'KeyA', keyCode: 65 },
      { press: '1', key: '1', code: 'Digit1', keyCode: 49 },
      { press: Cypress.Keyboard.Keys.ENTER, key: 'Enter', code: 'Enter', keyCode: 13 },
      { press: Cypress.Keyboard.Keys.TAB, key: 'Tab', code: 'Tab', keyCode: 9 },
      { press: Cypress.Keyboard.Keys.ESC, key: 'Escape', code: 'Escape', keyCode: 27 },
    ]

    expectedKeydowns.forEach(({ press, key, code, keyCode }) => {
      it(`sends key, code, keyCode and which for ${press}`, () => {
        cy.get('#textarea').focus()
        cy.press(press)
        cy.window().its('keydowns').should('deep.equal', [{
          key,
          code,
          keyCode,
          which: keyCode,
          location: 0,
          isTrusted: true,
        }])
      })
    })
  })

  Object.values(Cypress.Keyboard.Keys).forEach(testKeyDownUp)

  // sets truncated for speed

  // // Numbers
  ;['0', '1'].forEach(testKeyDownUp)

  ;[0, 1].forEach(testKeyDownUp)

  // // Letters
  ;['a', 'z'].forEach(testKeyDownUp)

  // // Special characters
  ;['!', ' ', '€', 'é'].forEach(testKeyDownUp)
})
