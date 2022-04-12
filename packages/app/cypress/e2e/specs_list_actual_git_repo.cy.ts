describe('Spec List - Git Status', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    .then((projectPath) => {
      cy.task('initGitRepoForTestProject', projectPath)
      cy.wait(500)
      cy.openProject('cypress-in-cypress')
      cy.startAppServer('e2e')
      cy.visitApp()
    })
  })

  it('shows correct git status for files using real git repo', () => {
    // newly created, not yet committed
    // this is performed by the task `initGitRepoForTestProject`
    cy.get('[data-cy-row="foo.spec.js"]')
    .contains('Created')
    .get('[data-cy="git-status-created"]')

    // modified by not yet committed
    // this is performed by the task `initGitRepoForTestProject`
    cy.get('[data-cy-row="blank-contents.spec.js"]')
    .contains('Modified')
    .get('[data-cy="git-status-modified"]')

    // unmodified by current user
    // we still show "modified" but a different style, indicating the last
    // person to touch the file.
    cy.get('[data-cy-row="dom-container.spec.js"]')
    .contains('Modified')
    .get('[data-cy="git-status-unmodified"]')

    cy.withCtx((ctx) => {
      ctx.fs.writeFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'dom-container.spec.js'),
        '// modifying the spec.',
      )
    })

    // should update via GraphQL subscription, now the status is modified.
    cy.get('[data-cy-row="dom-container.spec.js"]')
    .contains('Modified')
    .get('[data-cy="git-status-modified"]')
  })
})
