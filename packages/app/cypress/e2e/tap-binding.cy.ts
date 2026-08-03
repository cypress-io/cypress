const getBinding = (win: Cypress.AUTWindow) => {
  const binding = win.__CYPRESS_TAP_BINDING__

  if (!binding) {
    throw new Error('"window.__CYPRESS_TAP_BINDING__" is expected to be available')
  }

  return binding
}

type TapBinding = ReturnType<typeof getBinding>

const reporterResult = async (binding: TapBinding, options: Record<string, string> = {}): Promise<Record<string, any>> => {
  const outcome = await binding.exec('reporter', {}, options)

  if (!('result' in outcome)) {
    throw new Error(`the reporter command is expected to succeed, got ${JSON.stringify(outcome)}`)
  }

  return (outcome as { result: Record<string, any> }).result
}

// Test ids come from the reporter's spec overview. It groups tests by suite
// section, so flatten it back to document order to pick one out of a run.
const specTests = async (binding: TapBinding): Promise<Array<Record<string, any>>> => {
  const view = await reporterResult(binding)

  return [...view.tests, ...view.suites.flatMap((suite: Record<string, any>) => suite.tests)]
}

// Command ids come from the reporter view of a single test — its command log.
const reporterCommands = async (binding: TapBinding, options: Record<string, string>): Promise<Array<Record<string, any>>> => {
  return (await reporterResult(binding, options)).commands
}

// Each fixture spec holds a single test, so its id plus its command log is the
// starting point for anything addressing a command.
const firstTestCommands = async (binding: TapBinding): Promise<{ testId: string, commands: Array<Record<string, any>> }> => {
  const tests = await specTests(binding)
  const testId = tests[0].id as string

  return { testId, commands: await reporterCommands(binding, { test: testId }) }
}

const commandNamed = (commands: Array<Record<string, any>>, name: string): Record<string, any> => {
  const command = commands.find((entry) => entry.name === name)

  expect(command, `the ${name} command`).to.exist

  return command!
}

const ENTRY_KEYS = ['id', 'name', 'message', 'state', 'type', 'hook', 'network', 'cleanedUp', 'snapshots', 'consoleProps']
const SNAPSHOT_KEYS = ['index', 'name', 'timestamp']
const NETWORK_KEYS = ['method', 'url', 'indicator', 'status', 'stubbed', 'numResponses', 'alias']

const withinKeys = (allowed: string[]) => {
  return (keys: string[]) => keys.every((key) => allowed.includes(key))
}

// Reads every row of a test's command log back through the singular `command`,
// the one command that details a row now that the plural listing is gone.
const leanEntries = async (binding: TapBinding, testId: string, rows: Array<Record<string, any>>): Promise<Array<Record<string, any>>> => {
  const entries: Array<Record<string, any>> = []

  for (const row of rows) {
    const outcome = await binding.exec('command', {}, { test: testId, command: row.id as string })

    if (!('result' in outcome)) {
      throw new Error(`row ${row.id} is expected to resolve, got ${JSON.stringify(outcome)}`)
    }

    entries.push((outcome as { result: Record<string, any> }).result)
  }

  return entries
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
      const names = schema.commands.map((command) => command.name)

      expect(schema.schemaVersion).to.eq(1)
      expect(names).to.include.members(['command', 'reporter', 'pin', 'run-state'])
      expect(names).not.to.include('console-props')
      // The two list subcommands folded into reporter: its spec overview lists
      // the run's tests, and its --test view lists one test's command log.
      expect(names).not.to.include('tests')
      expect(names).not.to.include('commands')

      const unknown = await binding.exec('not-a-command')

      expect((unknown as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      const commandWithoutCommandId = await binding.exec('command', {}, { test: 'r1' })

      expect((commandWithoutCommandId as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')

      // No spec has run yet, so there is no run to read — a domain failure.
      const specViewBeforeRun = await binding.exec('reporter')

      expect((specViewBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

      const commandBeforeRun = await binding.exec('command', {}, { test: 'r1', command: '1' })

      expect((commandBeforeRun as { error: { code: string } }).error.code).to.eq('NO_RUN')

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

  it('reads the reporter view and run-state for a completed run', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/dom-content.spec.js')

    cy.waitForSpecToFinish({ passCount: 1 })
    cy.reporter().contains('Dom Content').should('be.visible')

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const specView = await reporterResult(binding)

      expect(specView.spec).to.eq('cypress/e2e/dom-content.spec.js')
      expect(specView.stats).to.include({ passed: 1, failed: 0 })
      // The fixture's one test lives in a suite, so the overview groups it there
      // rather than listing it at the root.
      expect(specView.tests).to.deep.eq([])
      expect(specView.suites.map((suite: Record<string, any>) => suite.title)).to.deep.eq(['Dom Content'])

      const tests = [...specView.tests, ...specView.suites.flatMap((suite: Record<string, any>) => suite.tests)]

      expect(tests).to.have.length.greaterThan(0)

      for (const test of tests) {
        expect(Object.keys(test), `entry ${test.id}`).to.deep.eq(['id', 'title', 'state', 'duration', 'retries'])
        expect(test.state).to.eq('passed')
        expect(test.duration).to.be.a('number')
        expect(test.retries).to.eq(0)
      }

      const testId = tests[0].id as string

      const view = await reporterResult(binding, { test: testId })

      expect(view.test).to.deep.eq({
        id: testId,
        title: 'renders the test content',
        fullTitle: 'Dom Content > renders the test content',
        state: 'passed',
      })

      // The fixture has no before/after hooks, so the only section is the
      // synthesized test body — the reporter's bucket for the test's own commands.
      expect(view.hooks).to.deep.eq([{ hookId: testId, hookName: 'test body' }])
      expect(view.error).to.be.undefined

      const missingTest = await binding.exec('reporter', {}, { test: 'not-a-test' })

      expect((missingTest as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const commands = view.commands as Array<Record<string, any>>

      expect(commands).to.have.length.greaterThan(0)

      // Every row the reporter lists is addressable by its displayed id, and
      // reads back as a lean entry that stays within the wire contract.
      // cy.visit's document load logs a request row, so `network` is part of the
      // contract even here; the dedicated network spec below asserts its shape.
      for (const entry of await leanEntries(binding, testId, commands)) {
        expect(Object.keys(entry), `command ${entry.id}`).to.include.members(['id', 'name', 'hook', 'snapshots'])
        expect(Object.keys(entry), `command ${entry.id}`).to.satisfy(withinKeys(ENTRY_KEYS))
      }

      const missingCommandTest = await binding.exec('command', {}, { test: 'not-a-test', command: commands[0].id as string })

      expect((missingCommandTest as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')

      const missingSelectedCommand = await binding.exec('command', {}, { test: testId, command: 'not-a-command' })

      expect((missingSelectedCommand as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')

      const runStateOutcome = await binding.exec('run-state')

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

  it('selects a retried test’s attempt via --attempt', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/retries.cy.js')

    // The test fails on its first attempt, then passes on the retry.
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const tests = await specTests(binding)
      const testId = tests[0].id as string

      // One retry was taken, so two attempts exist — the overview reports both.
      expect(tests[0].state).to.eq('passed')
      expect(tests[0].retries).to.eq(1)
      expect(tests[0].attempts.map((attempt: Record<string, unknown>) => attempt.state)).to.deep.eq(['failed', 'passed'])

      const latest = await reporterResult(binding, { test: testId })

      expect(latest.test.state).to.eq('passed')
      // The passing latest attempt has no error panel.
      expect(latest.error).to.be.undefined

      const first = await reporterResult(binding, { test: testId, attempt: '1' })

      expect(first.test.id).to.eq(testId)
      expect(first.test.fullTitle).to.eq(latest.test.fullTitle)
      expect(first.test.state).to.eq('failed')
      expect(Object.keys(first.error)).to.satisfy(withinKeys(['name', 'message', 'stack', 'codeFrame']))
      expect(first.error.message).to.be.a('string')

      const second = await reporterResult(binding, { test: testId, attempt: '2' })

      expect(second).to.deep.eq(latest)

      const outOfRange = await binding.exec('reporter', {}, { test: testId, attempt: '3' })

      expect((outOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')

      // --attempt selects one test's attempt, so it has no meaning on the
      // spec-level overview.
      const overviewWithAttempt = await binding.exec('reporter', {}, { attempt: '1' })

      expect((overviewWithAttempt as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')

      // The failing first attempt has a failed command; the passing latest has none.
      expect(first.commands.some((command: Record<string, unknown>) => command.state === 'failed')).to.eq(true)
      expect(latest.commands.every((command: Record<string, unknown>) => command.state !== 'failed')).to.eq(true)

      const failedCommand = (first.commands as Array<Record<string, any>>).find((command) => command.state === 'failed')

      expect(failedCommand, 'failed command from attempt 1').to.exist

      const firstAttemptCommand = await binding.exec('command', {}, {
        test: testId,
        command: failedCommand!.id as string,
        attempt: '1',
      })

      const entry = (firstAttemptCommand as { result: Record<string, any> }).result

      // The lean entry is the reporter's row narrowed to the wire contract.
      expect(Object.keys(entry)).to.satisfy(withinKeys(ENTRY_KEYS))
      expect(entry).to.include({ id: failedCommand!.id, name: failedCommand!.name, state: 'failed' })

      // The console properties travel with the row, read from the same attempt.
      expect(entry.consoleProps).to.include({ name: failedCommand!.name, type: 'command' })

      const attemptOutOfRange = await binding.exec('command', {}, { test: testId, command: failedCommand!.id as string, attempt: '3' })

      expect((attemptOutOfRange as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')
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
      const { testId, commands } = await firstTestCommands(binding)
      const getToggle = commands.find((command) => command.name === 'get' && command.message === '#toggle')
      const emptyConsoleProps = commandNamed(commands, 'empty-console-props')

      expect(getToggle, 'the get #toggle command').to.exist

      const selectedCommand = await binding.exec('command', {}, { test: testId, command: getToggle!.id as string })

      const selected = (selectedCommand as { result: Record<string, unknown> }).result

      expect(Object.keys(selected)).to.deep.eq(['id', 'name', 'message', 'state', 'type', 'hook', 'snapshots', 'consoleProps'])
      // The row is the reporter's, narrowed to the wire contract, with the
      // section it ran in, the snapshots pinnable on it — always reported, even
      // for a row with none — and the properties it logged.
      expect(selected).to.deep.eq({
        id: getToggle!.id,
        name: getToggle!.name,
        message: getToggle!.message,
        state: getToggle!.state,
        type: getToggle!.type,
        hook: { hookId: testId, hookName: 'test body' },
        snapshots: selected.snapshots,
        consoleProps: selected.consoleProps,
      })

      const snapshots = selected.snapshots as Array<Record<string, unknown>>

      expect(snapshots).to.have.length.greaterThan(0)
      snapshots.forEach((snapshot, index) => {
        expect(Object.keys(snapshot), `snapshot ${index + 1}`).to.satisfy(withinKeys(SNAPSHOT_KEYS))
        expect(snapshot.index).to.eq(index + 1)
        expect(snapshot.timestamp).to.be.a('number')
      })

      const missingCommand = await binding.exec('command', {}, { test: testId })

      expect((missingCommand as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')

      const consoleProps = selected.consoleProps as Record<string, any>

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

      // A row the driver holds no details for still reports its row, with no
      // console properties on it.
      const unavailable = await binding.exec('command', {}, { test: testId, command: emptyConsoleProps.id as string })
      const withoutProps = (unavailable as { result: Record<string, unknown> }).result

      expect(withoutProps).to.have.property('id', emptyConsoleProps.id)
      expect(withoutProps).not.to.have.property('consoleProps')
    })
  })

  it('names a long console property by its length, and returns everything with --json', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/console-props.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)
      const { testId, commands } = await firstTestCommands(binding)
      const commandId = commandNamed(commands, 'deep-console-props').id as string
      const propsOf = async (options: Record<string, string> = {}) => {
        const result = await binding.exec('command', {}, { test: testId, command: commandId, ...options })

        return (result as { result: Record<string, any> }).result.consoleProps
      }

      const body = Array.from({ length: 500 }, (_unused, index) => ({ id: index, tags: ['a', 'b'] }))
      const withheldFor = (length: number) => `[${length.toLocaleString('en-US')} characters withheld — pass --json to include it]`

      const bounded = await propsOf()

      expect(bounded.props.actual.body).to.eq(withheldFor(JSON.stringify(body).length))
      expect(bounded.props.actual.note).to.eq(withheldFor(1200))
      // The structure around a bounded value stays readable: short values come
      // back exactly as the command logged them.
      expect(bounded.props.actual.status).to.eq(200)
      expect(bounded.props.actual.headers).to.deep.eq({ 'content-type': 'application/json' })

      const full = await propsOf({ json: 'true' })

      expect(full.props.actual.body).to.deep.eq(body)
      expect(full.props.actual.note).to.eq('x'.repeat(1200))
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

  // Resolves the run's real test and click-command ids from the reporter and
  // pins the click's "before" snapshot — the pre-click DOM, distinguishable
  // from the live page.
  const pinClickAtBefore = () => {
    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const { testId, commands } = await firstTestCommands(binding)
      const outcome = await binding.exec('pin', { test: testId, command: commandNamed(commands, 'click').id as string }, { at: 'before' })

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

      const { testId, commands } = await firstTestCommands(binding)
      const commandId = commandNamed(commands, 'click').id as string

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
      expect(Object.keys(pinOutcome.result.pinned)).to.satisfy((keys: string[]) => keys.every((key) => ['test', 'command', 'hookName', 'at'].includes(key)))
      expect(pinOutcome.result.pinned.test).to.eq(testId)
      // The pinned command is reported as its reporter row, the same shape run-state
      // reports, named by the hook section that row renders under.
      expect(pinOutcome.result.pinned.command.id).to.eq(commandId)
      expect(pinOutcome.result.pinned.command.name).to.eq('click')
      expect(pinOutcome.result.pinned.hookName).to.eq('test body')
      expect(pinOutcome.result.pinned.at).to.deep.eq({ index: 2, total: 2, name: 'after' })

      // Re-running pin on the pinned command moves it in place.
      const moved = (await binding.exec('pin', { test: testId, command: commandId }, { at: 'before' })) as { result: Record<string, any> }

      expect(moved.result.pinned.at).to.deep.eq({ index: 1, total: 2, name: 'before' })

      // run-state reports the pin while it is live, as the row the reporter shows.
      const runState = (await binding.exec('run-state')) as { result: Record<string, any> }

      expect(Object.keys(runState.result)).to.deep.eq(['spec', 'totalSpecs', 'state', 'totalTests', 'results', 'pinned'])
      expect(runState.result.pinned.test).to.eq(testId)
      expect(runState.result.pinned.at).to.deep.eq({ index: 1, total: 2, name: 'before' })
      expect(runState.result.pinned.command.id).to.eq(commandId)
      expect(runState.result.pinned.command.name).to.eq('click')
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
    cy.reporter().contains('li.command-name-click', 'click').find('.command-pin-target').first().click()
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

  it('surfaces high-level network detail on request and cy.request rows', () => {
    cy.visitApp('/specs/runner?file=cypress/e2e/network.cy.js')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.window().then(async (win) => {
      const binding = getBinding(win)

      const { testId, commands } = await firstTestCommands(binding)

      // The cy.intercept registration is bucketed under routes, not the command
      // log, so the ROUTES table is where it is asserted (see the reporter view
      // test below); every row here is a command with an id of its own.
      const entries = await leanEntries(binding, testId, commands)

      // Nothing internal leaks: every row stays within the wire contract, and
      // every network object stays within its typed field set.
      for (const entry of entries) {
        expect(Object.keys(entry), `row ${entry.id}`).to.satisfy(withinKeys(ENTRY_KEYS))

        if (entry.network) {
          expect(Object.keys(entry.network), `network ${entry.id}`).to.satisfy(withinKeys(NETWORK_KEYS))
        }
      }

      expect(entries.filter((entry) => entry.network), 'rows carrying network detail').to.have.length.greaterThan(0)

      // The stubbed request: served by the stub, so it did not go to origin.
      // Carries method, URL, the reporter's status indicator, and alias.
      const stubbed = entries.find((entry) => entry.name === 'request' && entry.network?.stubbed === true && entry.network?.alias === 'getUsers')

      expect(stubbed, 'the stubbed request row').to.exist
      expect(stubbed!.network.method).to.eq('GET')
      expect(stubbed!.network.url).to.contain('/api/users')
      expect(stubbed!.network.indicator).to.eq('successful')
      expect(stubbed!.message, 'the reporter display message').to.contain('/api/users')

      // A real request that went to origin (the page fetching itself).
      const real = entries.find((entry) => entry.name === 'request' && entry.network?.stubbed === false)

      expect(real, 'a real request row').to.exist
      expect(real!.network.method).to.be.a('string')
      expect(real!.network.indicator).to.be.a('string')

      // cy.request keeps its method/URL in the display message, exposing only
      // the status indicator as a structured field (no request URL on the log).
      const cyRequest = entries.find((entry) => entry.name === 'request' && entry.network && !entry.network.url && !entry.network.method && entry.network.indicator)

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

      const tests = await specTests(binding)
      const testId = tests[0].id as string

      const view = await reporterResult(binding, { test: testId })

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
      expect(Object.keys(view.routes[0])).to.satisfy(withinKeys(REPORTER_ROUTE_KEYS))
      expect(view.routes[0].method).to.eq('GET')
      expect(view.routes[0].url).to.contain('/api/users')
      expect(view.routes[0].stubbed).to.eq(true)
      expect(view.routes[0].alias).to.eq('getUsers')
      expect(view.routes[0].numResponses).to.be.greaterThan(0)
      expect(view.commands.some((command: Record<string, unknown>) => command.name === 'route')).to.eq(false)

      for (const command of view.commands as Array<Record<string, any>>) {
        expect(Object.keys(command), `row ${command.id}`).to.satisfy(withinKeys(REPORTER_COMMAND_KEYS))
        expect(command.hookId, `hookId of ${command.id}`).to.eq(testId)
      }

      // The stubbed fetch surfaces as an event row labeled by its displayName,
      // carrying the same network detail a lean command entry reports.
      const eventRow = (view.commands as Array<Record<string, any>>).find((command) => command.event === true && command.network?.stubbed === true)

      expect(eventRow, 'the stubbed request event row').to.exist
      expect(eventRow!.displayName).to.be.a('string')
      expect(eventRow!.network.indicator).to.eq('successful')
      expect(eventRow!.network.alias).to.eq('getUsers')
    })
  })
})
