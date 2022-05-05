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
    cy.get('[data-cy-row="foo.spec.js"] .git-info-row svg')
    .should('have.class', 'icon-light-jade-50')

    // modified by not yet committed
    // this is performed by the task `initGitRepoForTestProject`
    cy.get('[data-cy-row="blank-contents.spec.js"] .git-info-row svg')
    .should('have.class', 'icon-light-orange-50')

    // unmodified by current user
    // we still show "modified" but a different style, indicating the last
    // person to touch the file.
    cy.get('[data-cy-row="dom-container.spec.js"] .git-info-row svg')
    .should(($icon) => {
      $icon.map((i, el) => {
        expect(Cypress.$(el).attr('class')).to.eq('')
      })
    })

    cy.withCtx((ctx) => {
      ctx.fs.appendFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'dom-container.spec.js'),
        '// modifying the spec.',
        'utf-8',
      )
    })

    cy.wait(2000)
    // should update via GraphQL subscription, now the status is modified.
    cy.get('[data-cy-row="dom-container.spec.js"] .git-info-row svg')
    .should('have.class', 'icon-light-orange-50')

    cy.withCtx((ctx) => {
      ctx.fs.appendFileSync(
        ctx.path.join(ctx.currentProject!, 'cypress', 'e2e', 'foo.spec.js'),
        '// modifying the spec.',
        'utf-8',
      )
    })

    cy.wait(2000)
    // even if a created file is updated, the status should stay created
    cy.get('[data-cy-row="foo.spec.js"] .git-info-row svg')
    .should('have.class', 'icon-light-jade-50')

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

    cy.wait(2000)
    cy.get('[data-cy-row="dom-container.spec.js"] .git-info-row svg')
    .should(($icon) => {
      $icon.map((i, el) => {
        expect(Cypress.$(el).attr('class')).to.eq('')
      })
    })
  })
})
