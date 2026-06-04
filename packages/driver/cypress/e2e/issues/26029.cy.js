// https://github.com/cypress-io/cypress/issues/26029
describe('issue 26029', { browser: '!webkit' }, () => {
  it('keeps a programmatically-submitted form with target="_top" inside the AUT', () => {
    // A form created at runtime and submitted via `form.submit()` (rather than a
    // dispatched submit event) used to framebust out of the Cypress iframe because
    // `HTMLFormElement.submit()` doesn't fire a `submit` event for the capture-phase
    // guard to catch. The prototype patch neutralizes the `_top` target instead.
    cy.visit('/fixtures/issue-26029.html')
    cy.get('#submit').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })
})
