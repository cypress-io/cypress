import { tapManagerDataSource } from '../tap-manager-data-source'
import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/commands', () => {
  // Commands carry extras (displayName, hookId, …) to prove the handler keeps
  // only the lean fields. r2's failed first attempt has its own command log,
  // distinct from the passing latest attempt, so attempt selection is observable.
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'logs in',
      state: 'passed',
      commands: [
        { id: 'log-1', name: 'visit', message: '/login', state: 'passed', type: 'parent', displayName: 'visit', hookId: 'h1' },
        { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent' },
      ],
      prevAttempts: [
        {
          id: 'r2',
          title: 'logs in',
          state: 'failed',
          commands: [
            { id: 'log-a', name: 'visit', message: '/login', state: 'passed', type: 'parent' },
            { id: 'log-b', name: 'get', message: '#user', state: 'failed', type: 'parent', displayName: 'get' },
          ],
        },
      ],
    },
    r3: {
      id: 'r3',
      title: 'logs out',
    },
    // Once a test falls out of numTestsKeptInMemory, the driver's reduceMemory
    // nulls (not deletes) every non-preserved command attr, e.g. message.
    r4: {
      id: 'r4',
      title: 'evicted from memory',
      state: 'passed',
      commands: [
        { id: 'log-c', name: 'visit', message: null, state: 'passed', type: 'parent', _hasBeenCleanedUp: true },
      ],
    },
  }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the runner seam rather than replace it.
  const stubRunner = (runner: unknown) => cy.stub(tapManagerDataSource, 'getRunner').returns(runner)

  const getTestStateFrom = (state: Record<string, unknown>) => cy.stub().callsFake((id: string) => state[id])

  it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
    stubRunner(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r2' })

    expect(outcome).to.deep.eq({
      error: {
        code: 'NO_RUN',
        message: 'no spec has been run yet — use the run command to run a spec first',
      },
    })
  })

  it('fails with TEST_NOT_FOUND when no test of the run has that id', async () => {
    const getTestState = getTestStateFrom(TESTS_STATE)

    stubRunner({ getTestState })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'nope' })

    expect(getTestState).to.have.been.calledOnceWith('nope')
    expect(outcome).to.deep.eq({
      error: {
        code: 'TEST_NOT_FOUND',
        message: 'no test of this run matches the id "nope" — use the tests command to list this run’s tests',
      },
    })
  })

  it('returns just the command log for the requested test, keeping only the lean entry fields', async () => {
    const getTestState = getTestStateFrom(TESTS_STATE)

    stubRunner({ getTestState })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r2' })

    expect(getTestState).to.have.been.calledOnceWith('r2')

    expect(outcome).to.deep.eq({
      result: [
        { id: 'log-1', name: 'visit', message: '/login', state: 'passed', type: 'parent' },
        { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent' },
      ],
    })
  })

  it('drops command fields nulled by the driver’s memory cleanup and marks the entry cleanedUp', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r4' })

    expect(outcome).to.deep.eq({
      result: [
        { id: 'log-c', name: 'visit', state: 'passed', type: 'parent', cleanedUp: true },
      ],
    })
  })

  it('returns the requested attempt’s command log, 1-based (attempt 1 = first run, defaults to the latest)', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('commands', {}, { test: 'r2', attempt: '1' })).to.deep.eq({
      result: [
        { id: 'log-a', name: 'visit', message: '/login', state: 'passed', type: 'parent' },
        { id: 'log-b', name: 'get', message: '#user', state: 'failed', type: 'parent' },
      ],
    })

    // Attempt 2 is the latest, so it matches the default (no --attempt) result above.
    const latest = await manager.exec('commands', {}, { test: 'r2' })

    expect(await manager.exec('commands', {}, { test: 'r2', attempt: '2' })).to.deep.eq(latest)
  })

  it('fails with ATTEMPT_NOT_FOUND when the attempt is out of range or not a positive integer', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    for (const attempt of ['3', '0', '1.5']) {
      const outcome = await manager.exec('commands', {}, { test: 'r2', attempt })

      expect(outcome, `attempt ${attempt}`).to.deep.eq({
        error: {
          code: 'ATTEMPT_NOT_FOUND',
          message: 'test "r2" has 2 attempts; pass --attempt 1–2 (defaults to the latest)',
        },
      })
    }
  })

  it('reports a single-attempt test without a nonsensical 1–1 range', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r4', attempt: '2' })

    expect(outcome).to.deep.eq({
      error: {
        code: 'ATTEMPT_NOT_FOUND',
        message: 'test "r4" has only 1 attempt; --attempt selects an earlier attempt of a retried test',
      },
    })
  })

  it('returns one lean command entry when --command is passed without --props', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    expect(await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r2', command: 'log-2' })).to.deep.eq({
      result: { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent' },
    })
  })

  it('requires --command when --props is passed', async () => {
    const getRunner = stubRunner(undefined)

    expect(await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r2', props: 'true' })).to.deep.eq({
      error: {
        code: 'COMMAND_REQUIRED',
        message: 'pass --command <id> with --props — omit both options to list this test’s commands',
      },
    })

    expect(getRunner).not.to.have.been.called
  })

  it('returns JSON-safe console properties for the command selected by --props', async () => {
    const consoleProps = {
      name: 'get',
      type: 'command',
      props: {
        Selector: '#user',
        Elements: 1,
        Yielded: '<input#user>',
        Handler: 'function handler () {}',
        cycle: null,
      },
      table: {
        1: {
          name: 'Elements',
          data: [{ Element: '<input#user>' }],
          columns: ['Element'],
        },
      },
    }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog,
    })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r2', command: 'log-2', props: 'true' })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-2')
    expect(outcome).to.deep.eq({ result: consoleProps })
    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('selects console properties from the requested retry attempt', async () => {
    const consoleProps = { name: 'get', type: 'command', props: { Yielded: null } }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog,
    })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r2', command: 'log-b', props: 'true', attempt: '1' })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-b')
    expect(outcome).to.deep.eq({ result: consoleProps })
  })

  it('preserves the driver’s memory-cleanup message', async () => {
    const cleanup = { Message: 'The command details and snapshot has been cleaned up to reduce the number of tests in memory.' }

    stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog: () => cleanup,
    })

    expect(await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r4', command: 'log-c', props: 'true' })).to.deep.eq({
      result: cleanup,
    })
  })

  it('fails with COMMAND_NOT_FOUND when --props does not identify a command in the selected attempt', async () => {
    const getSerializedConsolePropsForLog = cy.stub()

    stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog,
    })

    expect(await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r2', command: 'log-2', props: 'true', attempt: '1' })).to.deep.eq({
      error: {
        code: 'COMMAND_NOT_FOUND',
        message: 'no command of this test matches the id "log-2" — omit --command to list this test’s commands',
      },
    })

    expect(getSerializedConsolePropsForLog).not.to.have.been.called
  })

  it('fails with CONSOLE_PROPS_UNAVAILABLE when the driver has no details for a listed command', async () => {
    stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog: () => undefined,
    })

    expect(await new TapManager(CYPRESS_VERSION).exec('commands', {}, { test: 'r2', command: 'log-2', props: 'true' })).to.deep.eq({
      error: {
        code: 'CONSOLE_PROPS_UNAVAILABLE',
        message: 'this command has no console properties available — command details are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)',
      },
    })
  })

  it('returns an empty command list for a known test that has not run yet, and round-trips through JSON', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r3' })

    expect(outcome).to.deep.eq({ result: [] })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('fails dispatch without reading the runner when the required test option is missing', async () => {
    const getRunner = stubRunner({ getTestState: () => undefined })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands')

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')
    expect(getRunner).not.to.have.been.called
  })
})
