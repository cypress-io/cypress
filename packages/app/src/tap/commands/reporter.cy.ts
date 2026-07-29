import { tapManagerDataSource } from '../tap-manager-data-source'
import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/reporter', () => {
  // Mirrors the serialized shapes the driver emits: hook runs recorded under
  // their hook name in `timings`, cy.intercept registrations bucketed under
  // `routes`, and commands carrying the display-level attrs the reporter panel
  // reads (hookId, displayName, event, group/groupLevel, renderProps). Extra
  // attrs (chainerId, timeout) prove the serializer keeps only the typed fields.
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'loads users',
      _titlePath: ['Users', 'loads users'],
      state: 'passed',
      timings: {
        lifecycle: 30,
        'before each': [{ hookId: 'h1', fnDuration: 5, afterFnDuration: 1 }],
        test: { fnDuration: 20, afterFnDuration: 1 },
      },
      routes: [
        {
          id: 'log-int', name: 'route', state: 'pending', instrument: 'route', createdAtTimestamp: 2,
          method: 'GET', url: '**/api/users', isStubbed: true, status: 200,
          numResponses: 1, alias: 'getUsers', chainerId: 'ch1',
        },
      ],
      // The agents bucket mirrors the driver's serialized `instrument: 'agent'`
      // logs — the SPIES / STUBS panel, apart from the command log.
      agents: [
        {
          id: 'log-agent', name: 'spy-1', instrument: 'agent', functionName: 'beep',
          alias: 'beep', aliasType: 'agent', callCount: 2, count: 1,
        },
      ],
      commands: [
        { id: 'log-1', name: 'visit', message: '/users', state: 'passed', type: 'parent', hookId: 'h1', event: false, timeout: 4000, createdAtTimestamp: 1 },
        { id: 'log-2', name: 'get', message: '#list', state: 'passed', type: 'parent', hookId: 'r2', event: false, createdAtTimestamp: 3 },
        {
          id: 'log-3', name: 'request', displayName: 'xhr', state: 'passed', type: 'parent', hookId: 'r2',
          event: true, message: '', createdAtTimestamp: 4,
          renderProps: {
            indicator: 'successful', message: 'GET 200 /api/users', wentToOrigin: false,
            interceptions: [{ command: 'intercept', alias: 'getUsers', type: 'stub' }],
          },
          method: 'GET', url: 'http://localhost:2121/api/users', alias: 'getUsers',
        },
        { id: 'log-4', name: 'session-group', message: 'user', state: 'passed', type: 'parent', hookId: 'r2', group: 'log-2', groupLevel: 1, createdAtTimestamp: 5 },
        // A cy.session group log: an ordinary command carrying sessionInfo — the
        // driver has no session instrument, this is what feeds the SESSIONS panel.
        {
          id: 'log-5', name: 'session', message: 'user-1', state: 'passed', type: 'parent', hookId: 'r2', createdAtTimestamp: 6,
          sessionInfo: { id: 'user-1', isGlobalSession: true, status: 'restored' },
        },
        {
          id: 'log-6', name: 'spy-1', displayName: 'spy-1', message: 'beep()', state: 'passed', type: 'parent', hookId: 'r2',
          event: true, createdAtTimestamp: 7, alias: ['beep'], aliasType: 'agent',
        },
        {
          id: 'log-7', name: 'wait', message: '@getUsers', state: 'passed', type: 'parent', hookId: 'r2', createdAtTimestamp: 8,
          referencesAlias: [{ name: 'getUsers', cardinal: 1, ordinal: '1st' }], aliasType: 'route',
        },
      ],
    },
    r3: {
      id: 'r3',
      title: 'never ran',
    },
    // A failed test: err carries messaging fields plus a code frame; extras on
    // both (parsedStack, absoluteFile, language) prove the error serializes down
    // to the typed panel fields.
    r4: {
      id: 'r4',
      title: 'fails',
      state: 'failed',
      commands: [
        { id: 'log-f', name: 'assert', message: 'expected **1** to eq **2**', state: 'failed', type: 'child', hookId: 'r4' },
      ],
      err: {
        name: 'AssertionError',
        message: 'expected 1 to eq 2',
        stack: 'AssertionError: expected 1 to eq 2\n  at <anonymous>',
        parsedStack: [{ line: 3 }],
        codeFrame: {
          line: 12,
          column: 8,
          relativeFile: 'cypress/e2e/fails.cy.js',
          absoluteFile: '/projects/app/cypress/e2e/fails.cy.js',
          frame: '> 12 |   expect(1).to.eq(2)\n',
          language: 'js',
        },
      },
    },
    // Ran the full hook lifecycle: the driver records each hook under its name
    // in `timings` in run order, so the test body belongs between the `before`
    // and `after` hooks.
    r5: {
      id: 'r5',
      title: 'full lifecycle',
      state: 'passed',
      timings: {
        'before all': [{ hookId: 'h-ba', fnDuration: 3, afterFnDuration: 1 }],
        'before each': [{ hookId: 'h-be', fnDuration: 3, afterFnDuration: 1 }],
        test: { fnDuration: 20, afterFnDuration: 1 },
        'after each': [{ hookId: 'h-ae', fnDuration: 3, afterFnDuration: 1 }],
        'after all': [{ hookId: 'h-aa', fnDuration: 3, afterFnDuration: 1 }],
      },
    },
  }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the runner seam rather than replace it.
  const stubRunner = (runner: unknown) => cy.stub(tapManagerDataSource, 'getRunner').returns(runner)

  it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
    stubRunner(undefined)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter', {}, { test: 'r2' })

    expect(outcome).to.deep.eq({
      error: {
        code: 'NO_RUN',
        message: 'no spec has been run yet — use the run command to run a spec first',
      },
    })
  })

  it('fails with TEST_NOT_FOUND when no test of the run has that id', async () => {
    stubRunner({ getTestState: () => undefined, isRunComplete: () => false })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter', {}, { test: 'nope' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')
  })

  it('fails dispatch without reading the runner when the required test option is missing', async () => {
    const getRunner = stubRunner({ getTestState: () => undefined, isRunComplete: () => false })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter')

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')
    expect(getRunner).not.to.have.been.called
  })

  it('returns the full reporter view: test header, hooks with a synthesized test body, routes, and enriched commands', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id], isRunComplete: () => false })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter', {}, { test: 'r2' })

    expect(outcome).to.deep.eq({
      result: {
        test: { id: 'r2', title: 'loads users', fullTitle: 'Users > loads users', state: 'passed' },
        hooks: [
          { hookId: 'h1', hookName: 'before each' },
          { hookId: 'r2', hookName: 'test body' },
        ],
        // Ids are the reporter's own numbers, counted per hook section, while
        // event rows take the attempt-wide `e` sequence; the route registration
        // isn't a command, so it carries no id, and the group reference is
        // remapped into the same id space.
        sessions: [
          { name: 'user-1', status: 'restored', global: true },
        ],
        agents: [
          { type: 'spy-1', functionName: 'beep', aliases: ['beep'], callCount: 2 },
        ],
        routes: [
          { method: 'GET', url: '**/api/users', stubbed: true, status: 200, numResponses: 1, alias: 'getUsers' },
        ],
        commands: [
          { id: '1', name: 'visit', message: '/users', state: 'passed', type: 'parent', hookId: 'h1' },
          { id: '1', name: 'get', message: '#list', state: 'passed', type: 'parent', hookId: 'r2' },
          {
            id: 'e1', name: 'request', displayName: 'xhr', message: 'GET 200 /api/users', state: 'passed', type: 'parent', hookId: 'r2', event: true,
            aliases: ['getUsers'],
            network: { method: 'GET', url: 'http://localhost:2121/api/users', indicator: 'successful', stubbed: true, alias: 'getUsers' },
          },
          { id: '2', name: 'session-group', message: 'user', state: 'passed', type: 'parent', hookId: 'r2', group: '1', groupLevel: 1 },
          { id: '3', name: 'session', message: 'user-1', state: 'passed', type: 'parent', hookId: 'r2' },
          {
            id: 'e2', name: 'spy-1', displayName: 'spy-1', message: 'beep()', state: 'passed', type: 'parent', hookId: 'r2', event: true,
            aliases: ['beep'], aliasType: 'agent',
          },
          {
            id: '4', name: 'wait', message: '@getUsers', state: 'passed', type: 'parent', hookId: 'r2',
            referencedAliases: ['getUsers'], aliasType: 'route',
          },
        ],
      },
    })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('carries a failed attempt’s error panel — messaging fields and code frame, extras trimmed', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id], isRunComplete: () => true })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter', {}, { test: 'r4' })

    expect((outcome as { result: Record<string, unknown> }).result.error).to.deep.eq({
      name: 'AssertionError',
      message: 'expected 1 to eq 2',
      stack: 'AssertionError: expected 1 to eq 2\n  at <anonymous>',
      codeFrame: {
        file: 'cypress/e2e/fails.cy.js',
        line: 12,
        column: 8,
        frame: '> 12 |   expect(1).to.eq(2)\n',
      },
    })
  })

  it('reports an unreached test with empty collections and just the test-body pseudo-hook', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id], isRunComplete: () => true })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter', {}, { test: 'r3' })

    expect(outcome).to.deep.eq({
      result: {
        test: { id: 'r3', title: 'never ran', fullTitle: 'never ran', state: 'skipped' },
        hooks: [{ hookId: 'r3', hookName: 'test body' }],
        sessions: [],
        agents: [],
        routes: [],
        commands: [],
      },
    })
  })

  it('orders the synthesized test body between the before and after hooks', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id], isRunComplete: () => true })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('reporter', {}, { test: 'r5' })

    expect((outcome as { result: { hooks: unknown } }).result.hooks).to.deep.eq([
      { hookId: 'h-ba', hookName: 'before all' },
      { hookId: 'h-be', hookName: 'before each' },
      { hookId: 'r5', hookName: 'test body' },
      { hookId: 'h-ae', hookName: 'after each' },
      { hookId: 'h-aa', hookName: 'after all' },
    ])
  })
})
