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
      expect(schema.commands.map((command) => command.name)).to.include.members(['tests', 'commands', 'command', 'reporter'])
      expect(schema.commands.map((command) => command.name)).not.to.include('console-props')

      const unknown = await binding.exec('not-a-command')

      expect((unknown as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      const consolePropsWithoutCommand = await binding.exec('command', {}, { test: 'r1', props: 'true' })

      expect((consolePropsWithoutCommand as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')

      // No spec has run yet, so there is no run to read — a domain failure.
      const testsBeforeRun = await binding.exec('tests')

      expect((testsBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      const commandsBeforeRun = await binding.exec('commands', {}, { test: 'r1' })

      expect((commandsBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      const consolePropsBeforeRun = await binding.exec('command', {}, { test: 'r1', command: 'log-1', props: 'true' })

      expect((consolePropsBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      const reporterBeforeRun = await binding.exec('reporter', {}, { test: 'r1' })

      expect((reporterBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      // specs and run are CLI-native commands now — the CLI reads the spec list and
      // triggers runs directly over the instance's GraphQL — so the binding no longer serves them.
      const specsOutcome = await binding.exec('specs')

      expect((specsOutcome as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      const runOutcome = await binding.exec('run', { spec: 'cypress/e2e/dom-content.spec.js' })

      expect((runOutcome as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      // With no run yet there is no runner to read, so run-state omits the run-only fields.
      const runStateBeforeRun = await binding.exec('run-state')

      expect('result' in runStateBeforeRun).to.eq(true)

      const beforeRun = (runStateBeforeRun as { result: Record<string, unknown> }).result

      expect(Object.keys(beforeRun)).to.deep.eq(['spec', 'totalSpecs'])
      expect(beforeRun.spec).to.eq(null)
      expect(beforeRun.totalSpecs).to.be.a('number').and.to.be.greaterThan(0)
    })
  })

  it('reads tests, commands, and run-state for a completed run', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/dom-content.spec.js')

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
        // cy.visit's document load logs a request row, so `network` is part of
        // the contract even here; the dedicated network spec below asserts its shape.
        expect(Object.keys(command)).to.satisfy((keys: string[]) => keys.every((key) => ['id', 'name', 'message', 'state', 'type', 'network', 'cleanedUp'].includes(key)))
      }

      const missing = await getBinding(win).exec('commands', {}, { test: 'not-a-test' })

      expect((missing as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const missingConsolePropsTest = await getBinding(win).exec('command', {}, { test: 'not-a-test', command: commands[0].id as string, props: 'true' })

      expect((missingConsolePropsTest as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const missingConsolePropsCommand = await getBinding(win).exec('command', {}, { test: testId, command: 'not-a-command', props: 'true' })

      expect((missingConsolePropsCommand as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')

      const missingSelectedCommand = await getBinding(win).exec('command', {}, { test: testId, command: 'not-a-command' })

      expect((missingSelectedCommand as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')

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
    cy.visitApp('/specs/runner?file=cypress/e2e/retries.cy.js')

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

      const failedCommand = firstCommands.result.find((command) => command.state === 'failed')

      expect(failedCommand, 'failed command from attempt 1').to.exist

      const firstAttemptCommand = await binding.exec('command', {}, {
        test: testId,
        command: failedCommand!.id as string,
        attempt: '1',
      })

      expect((firstAttemptCommand as { result: Record<string, unknown> }).result).to.deep.eq(failedCommand)

      const firstAttemptConsoleProps = await binding.exec('command', {}, {
        test: testId,
        command: failedCommand!.id as string,
        props: 'true',
        attempt: '1',
      })

      expect('result' in firstAttemptConsoleProps).to.eq(true)
      expect((firstAttemptConsoleProps as { result: Record<string, unknown> }).result).to.include({
        name: failedCommand!.name,
        type: 'command',
      })

      const commandsOutOfRange = await binding.exec('commands', {}, { test: testId, attempt: '3' })

      expect((commandsOutOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')

      const consolePropsOutOfRange = await binding.exec('command', {}, { test: testId, command: failedCommand!.id as string, props: 'true', attempt: '3' })

      expect((consolePropsOutOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')

      // reporter selects attempts through the same machinery: the first
      // attempt's view carries its failed state, its error panel, and
      // out-of-range still fails.
      const firstReporter = (await binding.exec('reporter', {}, { test: testId, attempt: '1' })) as { result: Record<string, any> }

      expect(firstReporter.result.test.state).to.eq('failed')
      expect(firstReporter.result.commands.some((command: Record<string, unknown>) => command.state === 'failed')).to.eq(true)
      expect(Object.keys(firstReporter.result.error)).to.satisfy((keys: string[]) => keys.every((key) => ['name', 'message', 'stack', 'codeFrame'].includes(key)))
      expect(firstReporter.result.error.message).to.be.a('string')

      // The passing latest attempt has no error panel.
      const latestReporter = (await binding.exec('reporter', {}, { test: testId })) as { result: Record<string, unknown> }

      expect(latestReporter.result.error).to.be.undefined

      const reporterOutOfRange = await binding.exec('reporter', {}, { test: testId, attempt: '3' })

      expect((reporterOutOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')
    })
  })
})

describe('tap binding console properties', () => {
  beforeEach(() => {
    cy.scaffoldProject('tap-retries')
    cy.openProject('tap-retries')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  it('returns JSON-safe command details and reports unavailable details', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/console-props.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)
      const tests = ((await binding.exec('tests')) as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string
      const commands = ((await binding.exec('commands', {}, { test: testId })) as { result: Array<Record<string, unknown>> }).result
      const getToggle = commands.find((command) => command.name === 'get' && command.message === '#toggle')
      const emptyConsoleProps = commands.find((command) => command.name === 'empty-console-props')

      expect(getToggle, 'the get #toggle command').to.exist
      expect(emptyConsoleProps, 'the empty console props log').to.exist

      const selectedCommand = await binding.exec('command', {}, { test: testId, command: getToggle!.id as string })

      const selected = (selectedCommand as { result: Record<string, unknown> }).result

      expect(Object.keys(selected)).to.deep.eq(['id', 'name', 'message', 'state', 'type'])
      expect(selected).to.deep.eq(getToggle)

      const missingCommand = await binding.exec('command', {}, { test: testId, props: 'true' })

      expect((missingCommand as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')

      const consolePropsOutcome = await binding.exec('command', {}, { test: testId, command: getToggle!.id as string, props: 'true' })

      expect('result' in consolePropsOutcome).to.eq(true)

      const consoleProps = (consolePropsOutcome as { result: Record<string, any> }).result

      expect(Object.keys(consoleProps)).to.deep.eq(['name', 'type', 'props'])
      expect(consoleProps.name).to.eq('get')
      expect(consoleProps.type).to.eq('command')
      expect(Object.keys(consoleProps.props)).to.deep.eq(['Selector', 'Yielded', 'Elements'])
      expect(consoleProps.props).to.deep.eq({
        Selector: '#toggle',
        Yielded: '<button#toggle>',
        Elements: 1,
      })

      expect(JSON.parse(JSON.stringify(consoleProps))).to.deep.eq(consoleProps)

      const unavailable = await binding.exec('command', {}, { test: testId, command: emptyConsoleProps!.id as string, props: 'true' })

      expect((unavailable as { error: { code: string } }).error.code).to.eq('CONSOLE_PROPS_UNAVAILABLE')
    })
  })

  it('names a long console property by its length, and returns everything with --full-report', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/console-props.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)
      const tests = ((await binding.exec('tests')) as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string
      const commands = ((await binding.exec('commands', {}, { test: testId })) as { result: Array<Record<string, unknown>> }).result
      const deep = commands.find((command) => command.name === 'deep-console-props')

      expect(deep, 'the deep console props log').to.exist

      const commandId = deep!.id as string
      const propsOf = async (options: Record<string, string> = {}) => {
        const result = await binding.exec('command', {}, { test: testId, command: commandId, props: 'true', ...options })

        return (result as { result: Record<string, any> }).result
      }

      const body = Array.from({ length: 500 }, (_unused, index) => ({ id: index, tags: ['a', 'b'] }))
      const withheldFor = (length: number) => `[${length.toLocaleString('en-US')} characters withheld — pass --full-report to include it]`

      const bounded = await propsOf()

      expect(bounded.props.actual.body).to.eq(withheldFor(JSON.stringify(body).length))
      expect(bounded.props.actual.note).to.eq(withheldFor(1200))
      // The structure around a bounded value stays readable: short values come
      // back exactly as the command logged them.
      expect(bounded.props.actual.status).to.eq(200)
      expect(bounded.props.actual.headers).to.deep.eq({ 'content-type': 'application/json' })

      const full = await propsOf({ 'full-report': 'true' })

      expect(full.props.actual.body).to.deep.eq(body)
      expect(full.props.actual.note).to.eq('x'.repeat(1200))

      const withoutProps = await binding.exec('command', {}, { 'test': testId, 'command': commandId, 'full-report': 'true' })

      expect((withoutProps as { error: { code: string } }).error.code).to.eq('PROPS_REQUIRED')
    })
  })
})

// The pin fixture also lives in the dedicated tap project (see above): its click
// mutates the page, so a pinned "before" snapshot is visibly different from the
// live DOM — the only way to prove the pin really swaps the AUT frame.
describe('tap binding pin lifecycle', () => {
  beforeEach(() => {
    cy.scaffoldProject('tap-retries')
    cy.openProject('tap-retries')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  const runPinTargetSpec = () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/pin-target.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })
  }

  // Re-reads the live document on every retry: pinning restores the snapshot
  // asynchronously and replaces the AUT body, so a body reference captured once
  // would go stale and keep reporting the pre-swap DOM.
  const expectAutStatus = (text: string) => {
    cy.get('iframe.aut-iframe').should(($autIframe) => {
      expect($autIframe.contents().find('#status').text()).to.eq(text)
    })
  }

  // Resolves the run's real test and click-command ids and pins the click's
  // "before" snapshot — the pre-click DOM, distinguishable from the live page.
  const pinClickAtBefore = () => {
    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const tests = ((await binding.exec('tests')) as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string
      const commands = ((await binding.exec('commands', {}, { test: testId })) as { result: Array<Record<string, unknown>> }).result
      const click = commands.find((command) => command.name === 'click')

      expect(click, 'the click command').to.exist

      const outcome = await binding.exec('pin', { test: testId, command: click!.id as string }, { at: 'before' })

      expect('result' in outcome).to.eq(true)
    })

    expectAutStatus('ready')
  }

  it('pins, moves, and releases a command snapshot against the real runner', () => {
    cy.window().then(async (win) => {
      const binding = getBinding(win)

      // Guards that need no run: a target is required before anything else, a
      // clear with nothing pinned is a no-op, and a pin needs a run to read.
      const noTarget = await binding.exec('pin')

      expect((noTarget as { error: { code: string } }).error.code).to.eq('PIN_TARGET_REQUIRED')

      const clearNoop = await binding.exec('pin', {}, { clear: 'true' })

      expect(clearNoop).to.deep.eq({ result: { cleared: false } })

      const beforeRun = await binding.exec('pin', { test: 'r2', command: '1' })

      expect((beforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')
    })

    runPinTargetSpec()

    // The live page ends in its clicked state.
    expectAutStatus('clicked')

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const tests = ((await binding.exec('tests')) as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string
      const commands = ((await binding.exec('commands', {}, { test: testId })) as { result: Array<Record<string, unknown>> }).result
      const click = commands.find((command) => command.name === 'click')

      expect(click, 'the click command').to.exist

      const commandId = click!.id as string

      const missingTest = await binding.exec('pin', { test: 'not-a-test', command: commandId })

      expect((missingTest as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const missingCommand = await binding.exec('pin', { test: testId, command: 'not-a-command' })

      expect((missingCommand as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')

      const missingSnapshot = await binding.exec('pin', { test: testId, command: commandId }, { at: 'during' })

      expect((missingSnapshot as { error: { code: string } }).error.code).to.eq('SNAPSHOT_NOT_FOUND')
      expect((missingSnapshot as { error: { message: string } }).error.message).to.contain('"before" (1)')

      // The default pin lands on the click's final snapshot.
      const pinOutcome = (await binding.exec('pin', { test: testId, command: commandId })) as { result: Record<string, any> }

      expect(Object.keys(pinOutcome.result)).to.satisfy((keys: string[]) => keys.every((key) => ['pinned', 'url'].includes(key)))
      expect(Object.keys(pinOutcome.result.pinned)).to.deep.eq(['test', 'command', 'at'])
      expect(pinOutcome.result.pinned.test).to.eq(testId)
      expect(pinOutcome.result.pinned.command).to.eq(commandId)
      expect(pinOutcome.result.pinned.at).to.deep.eq({ index: 2, name: 'after' })

      // Re-running pin on the pinned command moves it in place.
      const moved = (await binding.exec('pin', { test: testId, command: commandId }, { at: 'before' })) as { result: Record<string, any> }

      expect(moved.result.pinned.at).to.deep.eq({ index: 1, name: 'before' })

      // run-state reports the pin while it is live.
      const runState = (await binding.exec('run-state')) as { result: Record<string, any> }

      expect(Object.keys(runState.result)).to.deep.eq(['spec', 'totalSpecs', 'state', 'totalTests', 'results', 'pinned'])
      expect(runState.result.pinned).to.deep.eq({ command: commandId, at: { index: 1, name: 'before' } })
    })

    // The pinned "before" snapshot is really rendered into the AUT frame.
    cy.get('[data-testid=snapshot-controls]').should('be.visible')
    expectAutStatus('ready')

    cy.window().then(async (win) => {
      const cleared = await getBinding(win).exec('pin', {}, { clear: 'true' })

      expect(cleared).to.deep.eq({ result: { cleared: true } })

      const runState = (await getBinding(win).exec('run-state')) as { result: Record<string, unknown> }

      expect(Object.keys(runState.result)).to.deep.eq(['spec', 'totalSpecs', 'state', 'totalTests', 'results'])
    })

    // Clear restores the live DOM and the pin UI is gone.
    cy.get('[data-testid=snapshot-controls]').should('not.exist')
    expectAutStatus('clicked')
  })

  it('restores the captured DOM when the pin is released from the app UI', () => {
    runPinTargetSpec()

    const expectReleased = () => {
      expectAutStatus('clicked')

      cy.window().then(async (win) => {
        const runState = (await getBinding(win).exec('run-state')) as { result: Record<string, unknown> }

        expect(Object.keys(runState.result)).to.not.include('pinned')
      })
    }

    // The unpin control over the AUT.
    pinClickAtBefore()
    cy.get('[data-testid=unpin]').click()
    expectReleased()

    // Clicking the pinned command in the reporter unpins through a different
    // event path than the control above — it must restore the DOM all the same.
    pinClickAtBefore()
    cy.contains('li.command-name-click', 'click').find('.command-pin-target').first().click()
    expectReleased()
  })
})

// The network fixture lives in the dedicated tap project too (see above): it
// needs a served page and an intercept, which would perturb the shared
// cypress-in-cypress project's exact spec/command counts.
describe('tap binding with network activity', () => {
  beforeEach(() => {
    cy.scaffoldProject('tap-retries')
    cy.openProject('tap-retries')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  const ENTRY_KEYS = ['id', 'name', 'message', 'state', 'type', 'network', 'cleanedUp']
  const NETWORK_KEYS = ['method', 'url', 'indicator', 'status', 'stubbed', 'numResponses', 'alias']

  const withinKeys = (allowed: string[]) => {
    return (keys: string[]) => keys.every((key) => allowed.includes(key))
  }

  it('surfaces high-level network detail on request, intercept, and cy.request rows', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/network.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const tests = ((await binding.exec('tests')) as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string

      const commands = ((await binding.exec('commands', {}, { test: testId })) as { result: Array<Record<string, any>> }).result

      // Nothing internal leaks: every row stays within the wire contract, and
      // every network object stays within its typed field set.
      for (const command of commands) {
        expect(Object.keys(command), `row ${command.id}`).to.satisfy(withinKeys(ENTRY_KEYS))

        if (command.network) {
          expect(Object.keys(command.network), `network ${command.id}`).to.satisfy(withinKeys(NETWORK_KEYS))
        }
      }

      expect(commands.filter((command) => command.network), 'rows carrying network detail').to.have.length.greaterThan(0)

      // The cy.intercept registration is bucketed under routes; it merges into
      // the command log as a route row with the stubbed flag, matcher, alias,
      // and match count.
      const route = commands.find((command) => command.name === 'route')

      expect(route, 'the intercept route row').to.exist
      expect(route!.network.method).to.eq('GET')
      expect(route!.network.url).to.contain('/api/users')
      expect(route!.network.stubbed).to.eq(true)
      expect(route!.network.alias).to.eq('getUsers')
      expect(route!.network.numResponses).to.be.greaterThan(0)

      // The stubbed request itself: served by the stub, so it did not go to
      // origin. Carries method, URL, the reporter's status indicator, and alias.
      const stubbed = commands.find((command) => command.name === 'request' && command.network?.stubbed === true && command.network?.alias === 'getUsers')

      expect(stubbed, 'the stubbed request row').to.exist
      expect(stubbed!.network.method).to.eq('GET')
      expect(stubbed!.network.url).to.contain('/api/users')
      expect(stubbed!.network.indicator).to.eq('successful')
      expect(stubbed!.message, 'the reporter display message').to.contain('/api/users')

      // A real request that went to origin (the page fetching itself).
      const real = commands.find((command) => command.name === 'request' && command.network?.stubbed === false)

      expect(real, 'a real request row').to.exist
      expect(real!.network.method).to.be.a('string')
      expect(real!.network.indicator).to.be.a('string')

      // cy.request keeps its method/URL in the display message, exposing only
      // the status indicator as a structured field (no request URL on the log).
      const cyRequest = commands.find((command) => command.name === 'request' && command.network && !command.network.url && !command.network.method && command.network.indicator)

      expect(cyRequest, 'the cy.request row').to.exist
      expect(cyRequest!.network.indicator).to.eq('successful')
      expect(cyRequest!.message, 'the cy.request display message').to.match(/^GET \d+ /)
    })
  })

  const REPORTER_COMMAND_KEYS = ['id', 'name', 'displayName', 'message', 'state', 'type', 'hookId', 'event', 'group', 'groupLevel', 'aliases', 'aliasType', 'referencedAliases', 'network', 'cleanedUp']
  const REPORTER_ROUTE_KEYS = ['id', 'method', 'url', 'stubbed', 'status', 'numResponses', 'alias']

  it('renders the full reporter view for a test: header, hooks, routes, and enriched commands', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/network.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const missing = await binding.exec('reporter', {}, { test: 'not-a-test' })

      expect((missing as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const tests = ((await binding.exec('tests')) as { result: Array<Record<string, unknown>> }).result
      const testId = tests[0].id as string

      const outcome = (await binding.exec('reporter', {}, { test: testId })) as { result: Record<string, any> }
      const view = outcome.result

      expect(Object.keys(view)).to.deep.eq(['test', 'hooks', 'sessions', 'agents', 'routes', 'commands'])
      expect(view.test).to.deep.eq({
        id: testId,
        title: 'records intercept, real request, and cy.request detail',
        fullTitle: 'Network > records intercept, real request, and cy.request detail',
        state: 'passed',
      })

      // The fixture has no before/after hooks, so the sections are just the
      // synthesized test body — the reporter's bucket for the test's own commands.
      expect(view.hooks).to.deep.eq([{ hookId: testId, hookName: 'test body' }])

      // The cy.intercept registration lives in the ROUTES table, not the log.
      expect(view.routes).to.have.length(1)
      expect(Object.keys(view.routes[0])).to.satisfy((keys: string[]) => keys.every((key) => REPORTER_ROUTE_KEYS.includes(key)))
      expect(view.routes[0].method).to.eq('GET')
      expect(view.routes[0].url).to.contain('/api/users')
      expect(view.routes[0].stubbed).to.eq(true)
      expect(view.routes[0].alias).to.eq('getUsers')
      expect(view.routes[0].numResponses).to.be.greaterThan(0)
      expect(view.commands.some((command: Record<string, unknown>) => command.name === 'route')).to.eq(false)

      for (const command of view.commands as Array<Record<string, any>>) {
        expect(Object.keys(command), `row ${command.id}`).to.satisfy((keys: string[]) => keys.every((key) => REPORTER_COMMAND_KEYS.includes(key)))
        expect(command.hookId, `hookId of ${command.id}`).to.eq(testId)
      }

      // The stubbed fetch surfaces as an event row labeled by its displayName,
      // carrying the same network detail the commands command reports.
      const eventRow = (view.commands as Array<Record<string, any>>).find((command) => command.event === true && command.network?.stubbed === true)

      expect(eventRow, 'the stubbed request event row').to.exist
      expect(eventRow!.displayName).to.be.a('string')
      expect(eventRow!.network.indicator).to.eq('successful')
      expect(eventRow!.network.alias).to.eq('getUsers')
    })
  })
})
