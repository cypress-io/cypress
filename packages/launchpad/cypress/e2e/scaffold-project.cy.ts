// scaffold a new Cypress project against an existing project
// without Cypress.
// See `system-tests/projects/pristine` for an example.
// After adding your project for the first time and running
// the test, it will see what files are scaffolded and save them
// in a directory named `expected-cypress`.
// Each subsequent run will compare the scaffolded files
// to the newly created ones. If there is a descrepancy,
// the test will fail.
// To update your expected files, just delete the `expected-cypress`
// directory, or modify them by hand.
function scaffoldAndOpenE2EProject (
  name: Parameters<typeof cy.scaffoldProject>[0],
  language: 'js' | 'ts',
  args?: Parameters<typeof cy.openProject>[1],
) {
  cy.scaffoldProject(name)
  cy.openProject(name, args)

  cy.visitLaunchpad()

  cy.contains('Welcome to Cypress!').should('be.visible')
  cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
  cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
  cy.contains('E2E Testing').click()
  cy.contains(language === 'js' ? 'JavaScript' : 'TypeScript').click()
  cy.contains('Next').click()
  cy.contains('We added the following files to your project.')
  cy.contains('Continue').click()
  cy.contains('Choose a Browser')
}

function assertScaffoldedFilesAreCorrect () {
  cy.withCtx(async (ctx) => {
    const result = await ctx.actions.test.snapshotCypressDirectory()

    if (result.status === 'ok') {
      return result
    }

    throw new Error(result.message)
  }).then((res) => {
    cy.log(`✅ ${res.message}`)
  })
}

describe('scaffolding new projects', () => {
  it('scaffolds E2E for a plain JS project', () => {
    scaffoldAndOpenE2EProject('pristine', 'js')
    assertScaffoldedFilesAreCorrect()
  })

  it('scaffolds E2E for a plain TS project', () => {
    scaffoldAndOpenE2EProject('pristine', 'ts')
    assertScaffoldedFilesAreCorrect()
  })
})
