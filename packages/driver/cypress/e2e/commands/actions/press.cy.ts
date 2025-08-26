describe('src/cy/commands/actions/press', () => {
  // TODO: Webkit is not supported. https://github.com/cypress-io/cypress/issues/31054
  if (Cypress.isBrowser('webkit')) {
    return
  }

  beforeEach(() => {
    cy.visit('/fixtures/input_events.html')
  })

  const testKeyDownUp = (key) => {
    it(`dispatches ${key} keypress to the AUT`, () => {
      cy.press(key)
      cy.get('#keydown').should('have.value', key)

      // in some browsers, F6 will cause the frame to lose focus, so the keyup will not be triggered
      if (key !== 'F6') {
        cy.get('#keyup').should('have.value', key)
      }
    })
  }

  // // Numbers
  ;['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(testKeyDownUp)

  ;[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(testKeyDownUp)

  // // Letters
  ;['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].forEach(testKeyDownUp)

  // // Special characters
  ;['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=',
    '+', '[', ']', '{', '}', '\\', '|', ';', ':', '\'', '"', ',', '.',
    '<', '>', '/', '?', '`', '~', ' ', '€', 'é'].forEach(testKeyDownUp)

  Object.values(Cypress.Keyboard.Keys).filter((key) => key !== 'Space').forEach(testKeyDownUp)

  it('dispatches the input event when an input is modified via cy.press', () => {
    cy.get('#input_source').focus()
    cy.press('a')
    cy.get('#input_source').should('have.value', 'a')
    cy.get('#input').should('have.value', 'a')
  })

  it('sets the value of the keydown input to \&nbsp; from the onclick listener', () => {
    cy.get('#input_source').focus()
    cy.press(Cypress.Keyboard.Keys.SPACE)
    cy.get('#keydown').should('have.value', ' ')
  })

  describe('when space is pressed when a button is focused', () => {
    beforeEach(() => {
      cy.get('#button').focus()
    })

    it('fires the click event on the button when the named key is sent', () => {
      cy.press(Cypress.Keyboard.Keys.SPACE)
      cy.get('#checkbox').should('be.checked')
    })

    it('fires the click event on the button when a space is sent', () => {
      cy.press(' ')
      cy.get('#checkbox').should('be.checked')
    })
  })
})
