// https://github.com/cypress-io/cypress/issues/26029
describe('issue 26029', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-26029.html')
  })

  it('keeps a programmatically-submitted form with target="_top" inside the AUT', () => {
    // A form created at runtime and submitted via `form.submit()` (rather than a
    // dispatched submit event) used to framebust out of the Cypress iframe because
    // `HTMLFormElement.submit()` doesn't fire a `submit` event for the capture-phase
    // guard to catch. The prototype patch neutralizes the `_top` target instead.
    cy.get('#submit').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('keeps a programmatically-submitted form with target="_TOP" (uppercase) inside the AUT', () => {
    // The browser matches `_top` ASCII case-insensitively at navigation time, so an
    // uppercase target is just as obstructive and must be neutralized the same way.
    cy.get('#submit-uppercase').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })
})
