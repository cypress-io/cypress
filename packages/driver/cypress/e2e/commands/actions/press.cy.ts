describe('src/cy/commands/actions/press', () => {
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

  Object.values(Cypress.Keyboard.Keys).forEach(testKeyDownUp)

  // sets truncated for speed

  // // Numbers
  ;['0', '1'].forEach(testKeyDownUp)

  ;[0, 1].forEach(testKeyDownUp)

  // // Letters
  ;['a', 'z'].forEach(testKeyDownUp)

  // // Special characters
  // NOTE: WebKit (via Playwright) can only dispatch key events for characters
  // present in its keyboard layout. Characters outside the layout ('€', 'é') are
  // inserted as text without a keydown event, so they're excluded from this
  // keydown assertion in WebKit. This diverges from Chrome/Firefox, which
  // dispatch keydown/keyup events for these characters (via CDP/BiDi).
  const specialChars = Cypress.isBrowser('webkit') ? ['!', ' '] : ['!', ' ', '€', 'é']

  specialChars.forEach(testKeyDownUp)
})
