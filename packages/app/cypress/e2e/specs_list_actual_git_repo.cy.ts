describe('Spec List - Git Status', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    .then((projectPath) => {
      cy.openProject('cypress-in-cypress')
      cy.startAppServer('e2e')
      cy.task('initGitRepoForTestProject', projectPath)
      cy.visitApp()
    })
  })

  it('shows correct git status for files using real git repo', () => {
    cy.wait(500)

    // newly created, not yet committed
    // this is performed by the task `initGitRepoForTestProject`
    cy.get('[data-cy-row="foo.spec.js"] [data-cy="git-info-row"] svg')
    .should('have.class', 'icon-light-jade-50')

    // modified by not yet committed
    // this is performed by the task `initGitRepoForTestProject`
    cy.get('[data-cy-row="blank-contents.spec.js"] [data-cy="git-info-row"] svg')
    .should('have.class', 'icon-light-orange-50')

    // unmodified by current user
    // we still show "modified" but a different style, indicating the last
    // person to touch the file.
    cy.get('[data-cy-row="dom-container.spec.js"] [data-cy="git-info-row"] svg')
    .should('have.class', 'icon-light-gray-500')

    cy.withCtx((ctx) => {
      ctx.fs.appendFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'dom-container.spec.js'),
        '// modifying the spec.',
        'utf-8',
      )
    })

    cy.wait(500)
    // should update via GraphQL subscription, now the status is modified.
    cy.get('[data-cy-row="dom-container.spec.js"] [data-cy="git-info-row"] svg')
    .should('have.class', 'icon-light-orange-50')

    cy.withCtx((ctx) => {
      ctx.fs.appendFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'foo.spec.js'),
        '// modifying the spec.',
        'utf-8',
      )
    })

    cy.wait(500)

    // even if a created file is updated, the status should stay created
    cy.get('[data-cy-row="foo.spec.js"] [data-cy="git-info-row"] svg')
    .should('have.class', 'icon-light-jade-50')

    if (Cypress.platform !== 'win32') {
      // skip this test in Windows because of possible divergence in git behavior related to file permissions/stats
      // TLDR: git config value `core.filemode` should be set to false
      // See https://stackoverflow.com/questions/14564946/git-status-shows-changed-files-but-git-diff-doesnt and
      // https://github.com/microsoft/WSL/issues/184 for reference

      cy.withCtx((ctx) => {
        ctx.fs.writeFileSync(
          ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'dom-container.spec.js'),
`describe('Dom Content', () => {
  it('renders a container', () => {
    cy.get('.container')
  })
})
`,
'utf-8',
        )
      })

      cy.wait(500)

      cy.get('[data-cy-row="dom-container.spec.js"] [data-cy="git-info-row"] svg')
      .should('have.class', 'icon-light-gray-500')
    }
  })
})
