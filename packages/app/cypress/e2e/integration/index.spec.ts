describe('Index', () => {
  function initializeAndVisit (project: Parameters<typeof cy.setupE2E>[0]) {
    cy.setupE2E(project)
    cy.initializeApp()
    cy.visitApp()
  }

  it('shows "Create your first spec"', () => {
    initializeAndVisit('component-tests')
    cy.withCtx((ctx, o) => {
      ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
    })

    // after removing the default scaffolded spec, we should be prompted to create a first spec
    cy.visitApp()
    cy.contains('Create your first spec')
  })

  it('creates a spec from component', () => {
    initializeAndVisit('webpack-dev-server-react')
    cy.withCtx((ctx, o) => {
      ctx.actions.file.removeFileInProject('src/Hello.cy.jsx')
    })

    cy.visitApp()
  })
})
