describe('Index', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.initializeApp()
  })

  context('with no specs', () => {
    it('shows "Create your first spec"', () => {
    // after removing the default scaffolded spec, we should be prompted to create a first spec
      cy.visitApp()
      cy.withCtx((ctx, o) => {
        ctx.actions.file.removeFileInProject('cypress/integration/integration-spec.js')
      })

      cy.contains('Create your first spec')
    })
  })

  it('shows update cypress version modal immediately when out of date', () => {
    cy.visitApp('', { shouldForceHideUpdateModal: false })

    cy.intercept('query-HeaderBar_HeaderBarQuery', (req) => {
      req.continue((res) => {
        res.body.data.versions.current.id = '9.0.0'
        res.body.data.versions.current.version = '9.0.0'
        res.body.data.versions.current.released = '2020-10-10T20:00:00.000Z'

        res.body.data.versions.latest.id = '9.1.0'
        res.body.data.versions.latest.version = '9.1.0'
        res.body.data.versions.latest.released = '2021-12-12T20:00:00.000Z'

        res.send(res.body)
      })
    }).as('Query')

    cy.wait('@Query')

    cy.get('[data-cy="update-cypress-modal"]').contains('Upgrade to Cypress')
    cy.contains('You are currently running Version 9.0.0 of Cypress')
  })

  it('does not show update cypress version modal when up to date', () => {
    cy.visitApp('', { shouldForceHideUpdateModal: false })

    cy.intercept('query-HeaderBar_HeaderBarQuery', (req) => {
      req.continue((res) => {
        res.body.data.versions.current.id = '9.1.0'
        res.body.data.versions.current.version = '9.1.0'
        res.body.data.versions.current.released = '2021-12-12T20:00:00.000Z'

        res.body.data.versions.latest.id = '9.1.0'
        res.body.data.versions.latest.version = '9.1.0'
        res.body.data.versions.latest.released = '2021-12-12T20:00:00.000Z'

        res.send(res.body)
      })
    }).as('Query')

    cy.wait('@Query')

    cy.get('[data-cy="update-cypress-modal"]').should('not.exist')
  })
})
