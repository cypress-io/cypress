beforeEach(() => {
  Cypress.config('retries', 0)
})

const autIframeHasFocus = () => Object.getOwnPropertyDescriptor(top.Document.prototype, 'hasFocus').value.call(top.frames[1].document)

// https://github.com/cypress-io/cypress/issues/1939
it('has focus when running headlessly', () => {
  if (Cypress.browser.isHeadless) {
    // top (aka Cypress frame) should always be in focus
    // when running headlessly. if we aren't running headlessly
    // it may not be in focus if the user has clicked away.
    // we don't want this test to potentially fail in that case
    expect(top.document.hasFocus()).to.be.true
  }
})

// https://github.com/cypress-io/cypress/issues/1940
it('sets the AUT document.hasFocus to top.document.hasFocus', () => {
  // the AUT's hasFocus() method should always return whatever
  // the top does.
  cy.visit('/timeout')
  .then(() => {
    if (Cypress.browser.isHeadless) {
      return cy.document().invoke('hasFocus').should('be.true')
    }

    if (top.document.hasFocus()) {
      return cy.document().invoke('hasFocus').should('be.true')
    }

    cy.document().invoke('hasFocus').should('be.false')
  })
})

it('continues to have focus through top navigation', () => {
  cy
  .visit('http://localhost:3501/fixtures/generic.html')
  .then(() => {
    if (Cypress.browser.isHeadless) {
      // top (aka Cypress frame) should always be in focus
      // when running headlessly. if we aren't running headlessly
      // it may not be in focus if the user has clicked away.
      // we don't want this test to potentially fail in that case
      // it's OK if the autIframe has focus too, since that means the window still has focus
      expect(top.document.hasFocus() || autIframeHasFocus()).to.be.true
    }
  })
})
