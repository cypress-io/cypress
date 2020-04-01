// https://github.com/cypress-io/cypress/issues/1939
it('has focus when running headlessly in electron', (done) => {
  if (Cypress.browser.isHeadless) {
    // top (aka Cypress frame) should always be in focus
    // when running headlessly. if we aren't running headlessly
    // it may not be in focus if the user has clicked away.
    // we don't want this test to potentially fail in that case
    expect(top.document.hasFocus()).to.be.true
    done()
  } else {
    // else done and making sure only 2 path options are here
    done()
  }
})

// https://github.com/cypress-io/cypress/issues/1940
it('sets the AUT document.hasFocus to top.document.hasFocus', () => {
  // the AUT's hasFocus() method should always return whatever
  // the top does.
  cy.visit('/timeout')
  .then(() => {
    if (top.document.hasFocus()) {
      cy.document().invoke('hasFocus').should('be.true')
    }

    cy.document().invoke('hasFocus').should('be.false')
  })
})

it('continues to have focus through top navigations', (done) => {
  cy
  .visit('http://localhost:3501/fixtures/generic.html')
  .then(() => {
    if (Cypress.browser.isHeadless) {
      // top (aka Cypress frame) should always be in focus
      // when running headlessly. if we aren't running headlessly
      // it may not be in focus if the user has clicked away.
      // we don't want this test to potentially fail in that case
      expect(top.document.hasFocus()).to.be.true
      done()
    } else {
      // else done and making sure only 2 path options are here
      done()
    }
  })
})
