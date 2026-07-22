const getBinding = (win: Cypress.AUTWindow) => {
  const binding = win.__CYPRESS_TAP_BINDING__

  if (!binding) {
    throw new Error('"window.__CYPRESS_TAP_BINDING__" is expected to be available')
  }

  return binding
}

describe('tap binding', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  it('mounts window.__CYPRESS_TAP_BINDING__ on the runner top window', () => {
    cy.window().then(async (win) => {
      const binding = win.__CYPRESS_TAP_BINDING__

      if (!binding) {
        throw new Error('"window.__CYPRESS_TAP_BINDING__" is expected to be available')
      }

      const schema = await binding.getSchema()

      expect(schema.schemaVersion).to.eq(1)
      expect(schema.commands.map((command) => command.name)).to.include.members(['specs', 'run', 'tests', 'commands'])

      const unknown = await binding.exec('not-a-command')

      expect((unknown as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      // No spec has run yet, so there is no run to read — a domain failure.
      const testsBeforeRun = await binding.exec('tests')

      expect((testsBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      const commandsBeforeRun = await binding.exec('commands', {}, { test: 'r1' })

      expect((commandsBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      const outcome = await binding.exec('specs')

      expect('result' in outcome).to.eq(true)

      const specs = (outcome as { result: Array<{ relativePath: string, specType: string }> }).result

      expect(specs).to.deep.include({ relativePath: 'cypress/e2e/dom-content.spec.js', specType: 'integration' })

      for (const spec of specs) {
        expect(Object.keys(spec), `entry ${spec.relativePath}`).to.deep.eq(['relativePath', 'specType'])
      }

      // With no run yet there is no runner to read, so run-state omits the run-only fields.
      const runStateBeforeRun = await binding.exec('run-state')

      expect('result' in runStateBeforeRun).to.eq(true)

      const beforeRun = (runStateBeforeRun as { result: Record<string, unknown> }).result

      expect(Object.keys(beforeRun)).to.deep.eq(['spec', 'totalSpecs'])
      expect(beforeRun.spec).to.eq(null)
      expect(beforeRun.totalSpecs).to.eq(specs.length)
    })
  })

  it('lists a spec added while the instance is open, with no runner reload', () => {
    const added = 'cypress/e2e/added-while-open.spec.js'

    const relativePaths = async (win: Cypress.AUTWindow): Promise<string[]> => {
      const outcome = await getBinding(win).exec('specs')

      return (outcome as { result: Array<{ relativePath: string }> }).result.map((spec) => spec.relativePath)
    }

    cy.window().then(async (win) => {
      expect(await relativePaths(win), 'absent before it is written').not.to.include(added)
    })

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.file.writeFileInProject(o.added, `describe('added while open', () => { it('runs', () => { expect(true).to.be.true }) })`)
    }, { added })

    // The spec watcher pushes the new spec over GraphQL; tap reads it live, with
    // no page reload. Poll the binding until the watcher-updated query reflects it.
    cy.window().then((win) => {
      return (async () => {
        for (let attempt = 0; attempt < 20; attempt++) {
          if ((await relativePaths(win)).includes(added)) {
            return
          }

          await new Promise((resolve) => setTimeout(resolve, 250))
        }

        throw new Error(`spec "${added}" was never listed by tap specs after being written`)
      })()
    })
  })

  it('runs and reruns a spec via the run command', () => {
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

      const detailOutcome = await getBinding(win).exec('tests', { test: tests[0].id as string })

      expect('result' in detailOutcome).to.eq(true)

      const detail = (detailOutcome as { result: Record<string, unknown> }).result

      expect(detail.id).to.eq(tests[0].id)
      expect(detail.fullTitle).to.eq('Dom Content > renders the test content')
      expect(detail.state).to.eq('passed')
      expect(detail.timings).to.be.an('object')
      expect(detail.error).to.be.undefined

      const missingDetail = await getBinding(win).exec('tests', { test: 'not-a-test' })

      expect((missingDetail as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const testId = tests[0].id as string

      const commandsOutcome = await getBinding(win).exec('commands', {}, { test: testId })

      expect('result' in commandsOutcome).to.eq(true)

      const commands = (commandsOutcome as { result: Array<Record<string, unknown>> }).result

      expect(commands).to.have.length.greaterThan(0)

      for (const command of commands) {
        expect(Object.keys(command), `command ${command.id}`).to.include.members(['id', 'name'])
        expect(Object.keys(command)).to.satisfy((keys: string[]) => keys.every((key) => ['id', 'name', 'message', 'state', 'type'].includes(key)))
      }

      const missing = await getBinding(win).exec('commands', {}, { test: 'not-a-test' })

      expect((missing as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const runStateOutcome = await getBinding(win).exec('run-state')

      expect('result' in runStateOutcome).to.eq(true)

      const runState = (runStateOutcome as { result: Record<string, any> }).result

      expect(Object.keys(runState)).to.deep.eq(['spec', 'totalSpecs', 'state', 'totalTests', 'results'])
      expect(runState.spec).to.eq('cypress/e2e/dom-content.spec.js')
      expect(runState.state).to.eq('passed')
      expect(runState.totalTests).to.eq(tests.length)
      expect(Object.keys(runState.results)).to.deep.eq(['passed', 'failed', 'pending', 'skipped'])
      expect(runState.results.passed).to.eq(tests.length)
      expect(runState.results.failed).to.eq(0)
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

// The retrying fixture lives in its own project: adding a spec to the shared
// cypress-in-cypress project shifts its spec count, breaking the app e2e
// specs that assert exact counts against it.
describe('tap binding with a retrying spec', () => {
  beforeEach(() => {
    cy.scaffoldProject('tap-retries')
    cy.openProject('tap-retries')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  it('selects a retried test’s attempt via --attempt on tests and commands', () => {
    cy.window().then(async (win) => {
      const outcome = await getBinding(win).exec('run', { spec: 'cypress/e2e/retries.cy.js' })

      expect('result' in outcome).to.eq(true)
    })

    // The test fails on its first attempt, then passes on the retry.
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const listOutcome = await binding.exec('tests')
      const tests = (listOutcome as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string

      // One retry was taken, so two attempts exist.
      expect(tests[0].state).to.eq('passed')
      expect(tests[0].retries).to.eq(1)

      const latest = (await binding.exec('tests', { test: testId })) as { result: Record<string, unknown> }

      expect(latest.result.state).to.eq('passed')
      expect(latest.result.error).to.be.undefined

      const first = (await binding.exec('tests', { test: testId }, { attempt: '1' })) as { result: Record<string, unknown> }

      expect(first.result.id).to.eq(testId)
      expect(first.result.fullTitle).to.eq(latest.result.fullTitle)
      expect(first.result.state).to.eq('failed')
      expect(first.result.error).to.be.an('object')

      const second = (await binding.exec('tests', { test: testId }, { attempt: '2' })) as { result: Record<string, unknown> }

      expect(second.result).to.deep.eq(latest.result)

      const outOfRange = await binding.exec('tests', { test: testId }, { attempt: '3' })

      expect((outOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')

      const listWithAttempt = await binding.exec('tests', {}, { attempt: '1' })

      expect((listWithAttempt as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')

      const latestCommands = (await binding.exec('commands', {}, { test: testId })) as { result: Array<Record<string, unknown>> }
      const firstCommands = (await binding.exec('commands', {}, { test: testId, attempt: '1' })) as { result: Array<Record<string, unknown>> }

      expect(latestCommands.result).to.have.length.greaterThan(0)
      expect(firstCommands.result).to.have.length.greaterThan(0)

      // The failing first attempt has a failed command; the passing latest has none.
      expect(firstCommands.result.some((command) => command.state === 'failed')).to.eq(true)
      expect(latestCommands.result.every((command) => command.state !== 'failed')).to.eq(true)

      const commandsOutOfRange = await binding.exec('commands', {}, { test: testId, attempt: '3' })

      expect((commandsOutOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')
    })
  })
})
