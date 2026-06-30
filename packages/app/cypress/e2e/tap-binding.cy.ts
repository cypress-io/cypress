describe('tap binding', () => {
  it('mounts window.__CYPRESS_TAP_BINDING__ on the runner top window', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    cy.window().then(async (win) => {
      const binding = win.__CYPRESS_TAP_BINDING__

      if (!binding) {
        throw new Error('"window.__CYPRESS_TAP_BINDING__" is expected to be available')
      }

      const schema = await binding.getSchema()

      expect(schema.schemaVersion).to.eq(1)
      expect(schema.commands.map((command) => command.name)).to.include.members(['specs', 'run'])

      const unknown = await binding.exec('not-a-command')

      expect((unknown as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      const outcome = await binding.exec('specs')

      expect('result' in outcome).to.eq(true)

      const specs = (outcome as { result: Array<{ relativePath: string, specType: string }> }).result

      expect(specs).to.deep.include({ relativePath: 'cypress/e2e/dom-content.spec.js', specType: 'integration' })

      for (const spec of specs) {
        expect(Object.keys(spec), `entry ${spec.relativePath}`).to.deep.eq(['relativePath', 'specType'])
      }
    })
  })

  it('runs and reruns a spec via the run command', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    const getBinding = (win: Cypress.AUTWindow) => {
      const binding = win.__CYPRESS_TAP_BINDING__

      if (!binding) {
        throw new Error('"window.__CYPRESS_TAP_BINDING__" is expected to be available')
      }

      return binding
    }

    cy.window().then(async (win) => {
      const outcome = await getBinding(win).exec('run', { spec: 'cypress/e2e/dom-content.spec.js' })

      expect(outcome).to.deep.eq({
        result: { relativePath: 'cypress/e2e/dom-content.spec.js', specType: 'integration' },
      })
    })

    cy.location('hash')
    .should('contain', '/specs/runner?file=cypress/e2e/dom-content.spec.js')
    .and('match', /tapRun=\d+/)

    cy.waitForSpecToFinish({ passCount: 1 })
    cy.contains('Dom Content').should('be.visible')

    // Rerunning advances the nonce, so the query changes even though the spec is unchanged.
    cy.location('hash').then((hashBefore) => {
      cy.window().then(async (win) => {
        const outcome = await getBinding(win).exec('run', { spec: 'cypress/e2e/dom-content.spec.js' })

        expect('result' in outcome).to.eq(true)
      })

      cy.location('hash').should('not.eq', hashBefore)
      cy.waitForSpecToFinish({ passCount: 1 })
    })

    cy.location('hash').then((hashBefore) => {
      cy.window().then(async (win) => {
        const outcome = await getBinding(win).exec('run', { spec: 'cypress/e2e/does-not-exist.cy.js' })

        expect((outcome as { error: { code: string } }).error.code).to.eq('SPEC_NOT_FOUND')
        expect((outcome as { error: { message: string } }).error.message).to.contain('cypress/e2e/does-not-exist.cy.js')
      })

      // A domain failure never navigates.
      cy.location('hash').should('eq', hashBefore)
    })
  })
})
