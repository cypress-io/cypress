function scaffoldAndOpenProject (name: Parameters<typeof cy.scaffoldProject>[0], args?: Parameters<typeof cy.openProject>[1]) {
  cy.scaffoldProject(name)
  cy.openProject(name, args)

  cy.visitLaunchpad()

  cy.contains('Welcome to Cypress!').should('be.visible')
  cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
  cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
}

describe('scaffolding new projects', () => {
  it('scaffolds E2E for a plain JS project', () => {
    scaffoldAndOpenProject('pristine')
    cy.contains('E2E Testing').click()
    cy.contains('JavaScript').click()
    cy.contains('Next').click()
    cy.contains('We added the following files to your project.')
    cy.contains('Continue').click()
    cy.contains('Choose a Browser')
    cy.withCtx(async (ctx) => {
      const result = await ctx.actions.test.snapshotCypressDirectory()

      if (result.status === 'ok') {
        return result
      }

      throw new Error(result.message)
    }).then((res) => {
      cy.log(`✅ ${res.message}`)
    })
  })
})
