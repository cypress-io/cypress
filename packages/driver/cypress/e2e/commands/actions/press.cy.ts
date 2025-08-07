import { NamedKeys, SupportedKey } from '@packages/types'

describe('src/cy/commands/actions/press', () => {
  // Non-BiDi firefox is not supported
  if (Cypress.browser.family === 'firefox' && Cypress.browserMajorVersion() < 135) {
    return
  }

  // TODO: Webkit is not supported. https://github.com/cypress-io/cypress/issues/31054
  if (Cypress.isBrowser('webkit')) {
    return
  }

  beforeEach(() => {
    cy.visit('/fixtures/input_events.html')
  })

  const testKeyPress = (key: SupportedKey) => {
    it(`dispatches ${key} keypress to the AUT`, () => {
      cy.press(key)
      cy.get('#keydown').should('have.value', key)

      // in some browsers, F6 will cause the frame to lose focus, so the keyup will not be triggered
      if (key !== 'F6') {
        cy.get('#keyup').should('have.value', key)
      }
    })
  }

  // Numbers
  ;['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(testKeyPress)

  // Letters
  ;['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].forEach(testKeyPress)

  // Special characters
  ;['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=',
    '+', '[', ']', '{', '}', '\\', '|', ';', ':', '\'', '"', ',', '.',
    '<', '>', '/', '?', '`', '~', ' '].forEach(testKeyPress)

  NamedKeys.forEach(testKeyPress)
})
