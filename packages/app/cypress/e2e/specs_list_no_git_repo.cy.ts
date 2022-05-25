describe('Spec List - Last updated with no git info', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
  })

  it('shows no icon and file system timestamp for files', () => {
    cy.get('[data-cy-row="blank-contents.spec.js"] [data-cy="git-info-row"] svg')
    .should('not.exist')

    cy.get('[data-cy-row="blank-contents.spec.js"] [data-cy="git-info-row"]')
    .contains(/(a few|[0-9]) seconds? ago/)
  })
})
