describe('Cypress Studio - Limitations', () => {
  it('does not show the studio button in component testing mode', () => {
    // Load project in component testing mode
    cy.scaffoldProject('studio')
    cy.openProject('studio', ['--component'])
    cy.startAppServer('component')
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.get('[data-cy-row="HelloWorld.cy.jsx"]').eq(1).click()
    cy.waitForSpecToFinish({ passCount: 1 })

    // Verify studio button is not present
    cy.findByTestId('studio-button').should('not.exist')

    // Verify no launch studio buttons are present in test results
    cy.get('.runnable-wrapper').should('not.contain', '[data-cy="launch-studio"]')
  })

  it('hides studio button when running all specs', () => {
    // Use the run-all-specs project which already has run-all-specs enabled
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs')

    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    // Spawns new browser so we need to stub this
    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.project, 'launchProject').resolves()
    })

    // Run all specs
    cy.findByTestId('run-all-specs-for-all').click()

    // Wait for the runner to load
    cy.waitForSpecToFinish()

    // Verify that we're running all specs by checking the header
    cy.get('[data-cy="runnable-header"]').should('contain', 'All Specs')

    // Verify that the studio button is NOT visible when running all specs
    cy.findByTestId('studio-button').should('not.exist')

    // Verify that the studio panel is NOT visible
    cy.findByTestId('studio-panel').should('not.exist')
  })

  it('shows studio button when running a single spec', () => {
    // Use the existing studio project
    cy.scaffoldProject('studio')
    cy.openProject('studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    // Run a single spec instead of all specs
    cy.get('[data-cy-row="spec.cy.js"]').click()

    cy.waitForSpecToFinish()

    // Verify that we're running a single spec (not all specs)
    cy.get('[data-cy="runnable-header"]').should('contain', 'spec.cy.js')
    cy.get('[data-cy="runnable-header"]').should('not.contain', 'All Specs')

    // Verify that the studio button IS visible when running a single spec
    cy.findByTestId('studio-button').should('be.visible')
  })
})
