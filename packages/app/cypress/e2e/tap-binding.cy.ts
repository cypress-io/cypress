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
      expect(schema.commands.map((command) => command.name)).to.include.members(['specs', 'run', 'tests'])

      const unknown = await binding.exec('not-a-command')

      expect((unknown as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      // No spec has run yet, so the runner window has no Cypress instance to
      // read — a domain failure surfaced as { error }, not a stdout result.
      const testsBeforeRun = await binding.exec('tests')

      expect((testsBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

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

    // With a run finished, the tests command reads the runner's tests state.
    cy.window().then(async (win) => {
      const outcome = await getBinding(win).exec('tests')

      expect('result' in outcome).to.eq(true)

      const tests = (outcome as { result: Array<Record<string, unknown>> }).result

      expect(tests).to.have.length.greaterThan(0)

      for (const test of tests) {
        expect(Object.keys(test), `entry ${test.id}`).to.deep.eq(['id', 'title', 'duration', 'state', 'retries'])
        expect(test.state).to.eq('passed')
        expect(test.duration).to.be.a('number')
        expect(test.retries).to.eq(0)
      }

      // The tests command with an id details that one test: full title path,
      // per-phase timings, and (here, a passing test) no error.
      const detailOutcome = await getBinding(win).exec('tests', { test: tests[0].id as string })

      expect('result' in detailOutcome).to.eq(true)

      const detail = (detailOutcome as { result: Record<string, unknown> }).result

      expect(detail.id).to.eq(tests[0].id)
      expect(detail.fullTitle).to.be.a('string').and.contain(tests[0].title)
      expect(detail.state).to.eq('passed')
      expect(detail.timings).to.be.an('object')
      expect(detail.error).to.be.undefined

      // An unknown test id details nothing — a domain failure.
      const missingDetail = await getBinding(win).exec('tests', { test: 'not-a-test' })

      expect((missingDetail as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')
    })

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
