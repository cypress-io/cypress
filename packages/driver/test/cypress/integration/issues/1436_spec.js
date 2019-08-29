// https://github.com/cypress-io/cypress/issues/1436
describe('issue 1436', () => {
  it('returns the AUT window, not Cypress top', () => {
    cy.visit('/fixtures/issue-1436.html')
    cy.window().then((win) => {
      win.__app__ = true

      expect(win.getParent(win).__app__).to.be.true
      expect(win.getParentMin(win).__app__).to.be.true
    })
  })

  // NOTE: 11/15/18 jira is throwing an error in one
  // of their scripts and its causing this test to fail
  it.skip('can visit jira', () => {
    // no javascript errors should have been thrown.
    // NOTE: this is potentially a bad idea because we don't
    // control Jira, and therefore they could push changes
    // which cause Cypress to throw (or be down). if this
    // ends up happening we'll need to remove this test.
    cy.visit('https://jira.atlassian.com/secure/BrowseProjects.jspa?selectedCategory=all&selectedProjectType=all')
  })
})
