describe('Spec List - Last updated with no git info', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23474
  it.skip('shows no icon and file system timestamp for files', () => {
    cy.get('[data-cy-row="blank-contents.spec.js"] [data-cy="git-info-row"] svg')
    .should('not.exist')

    cy.withCtx((ctx) => {
      ctx.fs.appendFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'blank-contents.spec.js'),
        '// touching the spec.',
        'utf-8',
      )
    })

    cy.get('[data-cy-row="blank-contents.spec.js"] [data-cy="git-info-row"]')
    .contains(/(a few|[0-9]) seconds? ago/)
  })
})
