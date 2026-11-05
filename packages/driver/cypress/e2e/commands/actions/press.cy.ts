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

  Object.values(Cypress.Keyboard.Keys).forEach(testKeyDownUp)

  describe('modifier and function keys', () => {
    const keys = [
      { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
      { key: 'Control', code: 'ControlLeft', keyCode: 17 },
      { key: 'Alt', code: 'AltLeft', keyCode: 18 },
      { key: 'Meta', code: 'MetaLeft', keyCode: 91 },
      ...Array.from({ length: 12 }, (_, i) => ({ key: `F${i + 1}`, code: `F${i + 1}`, keyCode: 112 + i })),
    ] as const

    keys.forEach(({ key, code, keyCode }) => {
      it(`dispatches a trusted ${key} keydown`, () => {
        const keydowns: Pick<KeyboardEvent, 'isTrusted' | 'key' | 'code' | 'keyCode'>[] = []

        cy.document().then((doc) => {
          doc.addEventListener('keydown', ({ isTrusted, key, code, keyCode }) => {
            keydowns.push({ isTrusted, key, code, keyCode })
          })
        })

        cy.press(key)

        cy.wrap(keydowns).should('have.length', 1)
        cy.wrap(keydowns).its(0).should('include', { isTrusted: true, key })

        // Firefox derives code and keyCode from the WebDriver codepoint itself;
        // CDP is sent them explicitly.
        if (Cypress.isBrowser({ family: 'chromium' })) {
          cy.wrap(keydowns).its(0).should('include', { code, keyCode })
        }
      })
    })
  })

  // sets truncated for speed

  // // Numbers
  ;['0', '1'].forEach(testKeyDownUp)

  ;[0, 1].forEach(testKeyDownUp)

  // // Letters
  ;['a', 'z'].forEach(testKeyDownUp)

  // // Special characters
  ;['!', ' ', '€', 'é'].forEach(testKeyDownUp)
})
