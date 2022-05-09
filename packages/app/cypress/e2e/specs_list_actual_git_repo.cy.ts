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

    cy.withCtx((ctx) => {
      ctx.fs.appendFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'foo.spec.js'),
        '// modifying the spec.',
        'utf-8',
      )
    })

    // even if a created file is updated, the status should stay created
    cy.get('[data-cy-row="foo.spec.js"]')
    .contains('Created')
    .get('[data-cy="git-status-created"]')

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

    // reverting the updates to a file before committing should revert its status
    cy.get('[data-cy-row="dom-container.spec.js"]')
    .contains('Modified')
    .get('[data-cy="git-status-unmodified"]')
  })
})
