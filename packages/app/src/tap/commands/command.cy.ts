import { tapManagerDataSource } from '../tap-manager-data-source'
import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/command', () => {
  // A command handle is the row number the reporter displays, and those numbers
  // restart per hook section — so the before-each visit and the test body's first
  // command are both row 1, the duplicate the resolution rules have to settle.
  // r2's failed first attempt has its own command log, distinct from the passing
  // latest attempt, so attempt selection is observable. r4 stands in for a test
  // the driver evicted from memory (numTestsKeptInMemory).
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'logs in',
      state: 'passed',
      commands: [
        { id: 'log-1', name: 'visit', message: '/login', state: 'passed', type: 'parent', displayName: 'visit', hookId: 'h1' },
        { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent', hookId: 'r2' },
      ],
      // The driver times each hook it ran, which is where the reporter's section
      // names come from; the first attempt below has none, standing in for a hook
      // the attempt has not timed yet.
      timings: {
        'before each': [{ hookId: 'h1' }],
      },
      prevAttempts: [
        {
          id: 'r2',
          title: 'logs in',
          state: 'failed',
          commands: [
            { id: 'log-a', name: 'visit', message: '/login', state: 'passed', type: 'parent', hookId: 'h1' },
            { id: 'log-b', name: 'get', message: '#user', state: 'failed', type: 'parent', displayName: 'get', hookId: 'r2' },
          ],
        },
      ],
    },
    r4: {
      id: 'r4',
      title: 'evicted from memory',
      state: 'passed',
      commands: [
        { id: 'log-c', name: 'visit', message: null, state: 'passed', type: 'parent', hookId: 'r4', _hasBeenCleanedUp: true },
      ],
    },
  }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the runner seam rather than replace it.
  const stubRunner = (runner: unknown) => cy.stub(tapManagerDataSource, 'getRunner').returns(runner)

  const stubTests = (getSerializedConsolePropsForLog?: unknown) => {
    return stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog,
    })
  }

  it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
    stubRunner(undefined)

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      error: {
        code: 'NO_RUN',
        message: 'no spec has been run yet — use the run command to run a spec first',
      },
    })
  })

  it('fails with TEST_NOT_FOUND when no test of the run has that id', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'nope', command: '1' })).to.deep.eq({
      error: {
        code: 'TEST_NOT_FOUND',
        message: 'no test of this run matches the id "nope" — use the reporter command to list this run’s tests',
      },
    })
  })

  it('returns one lean command entry, keeping only the listed fields', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: 'h1:1' })).to.deep.eq({
      result: { id: '1', name: 'visit', message: '/login', state: 'passed', type: 'parent', hook: { hookId: 'h1', hookName: 'before each' } },
    })
  })

  // A hook the attempt has not timed yet has no name to report, so the entry
  // carries the id alone rather than dropping the section entirely.
  it('names the hook a row ran in, falling back to its id alone', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: 'h1:1', attempt: '1' })).to.deep.eq({
      result: { id: '1', name: 'visit', message: '/login', state: 'passed', type: 'parent', hook: { hookId: 'h1' } },
    })
  })

  // Row numbers restart per section, so `1` names both the before-each visit and
  // the test body's first command; the test body is what an unqualified id means.
  it('resolves a duplicated row number to the test body, not the hook', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent' },
    })
  })

  it('returns the entry from the requested attempt', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', attempt: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'failed', type: 'parent' },
    })
  })

  it('fails with ATTEMPT_NOT_FOUND when the attempt is out of range', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', attempt: '3' })).to.deep.eq({
      error: {
        code: 'ATTEMPT_NOT_FOUND',
        message: 'test "r2" has 2 attempts; pass --attempt 1–2 (defaults to the latest)',
      },
    })
  })

  it('fails with COMMAND_NOT_FOUND when no command of the selected attempt has that id', async () => {
    const getSerializedConsolePropsForLog = cy.stub()

    stubTests(getSerializedConsolePropsForLog)

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '9', props: 'true', attempt: '1' })).to.deep.eq({
      error: {
        code: 'COMMAND_NOT_FOUND',
        message: 'no command of this test matches the id "9" — use the reporter command (with --test) to list this test’s commands',
      },
    })

    expect(getSerializedConsolePropsForLog).not.to.have.been.called
  })

  // The driver keys its per-log details by its own log id, not by the row number
  // the reporter displays — so the handle has to be resolved before the lookup.
  it('returns JSON-safe console properties for --props, looked up by the driver log id', async () => {
    const consoleProps = {
      name: 'get',
      type: 'command',
      props: {
        Selector: '#user',
        Elements: 1,
        Yielded: '<input#user>',
        body: '[12,480 characters withheld — pass --full-report to include it]',
      },
    }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubTests(getSerializedConsolePropsForLog)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', props: 'true' })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-2', undefined)
    expect(outcome).to.deep.eq({ result: consoleProps })
    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('selects console properties from the requested retry attempt', async () => {
    const consoleProps = { name: 'get', type: 'command', props: { Yielded: null } }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubTests(getSerializedConsolePropsForLog)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', props: 'true', attempt: '1' })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-b', undefined)
    expect(outcome).to.deep.eq({ result: consoleProps })
  })

  it('preserves the driver’s memory-cleanup message', async () => {
    const cleanup = { Message: 'The command details and snapshot has been cleaned up to reduce the number of tests in memory.' }

    stubTests(() => cleanup)

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r4', command: '1', props: 'true' })).to.deep.eq({ result: cleanup })
  })

  it('fails with CONSOLE_PROPS_UNAVAILABLE when the driver has no details for a listed command', async () => {
    stubTests(() => undefined)

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', props: 'true' })).to.deep.eq({
      error: {
        code: 'CONSOLE_PROPS_UNAVAILABLE',
        message: 'this command has no console properties available — command details are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)',
      },
    })
  })

  it('asks the driver for every value in full for --full-report', async () => {
    const consoleProps = { name: 'request', type: 'command', props: { body: { user: 'jane' } } }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubTests(getSerializedConsolePropsForLog)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, {
      'test': 'r2',
      'command': '1',
      'props': 'true',
      'full-report': 'true',
    })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-2', { fullReport: true })
    expect(outcome).to.deep.eq({ result: consoleProps })
  })

  it('fails with PROPS_REQUIRED before reading the runner when --full-report has no --props', async () => {
    const getRunner = stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { 'test': 'r2', 'command': '1', 'full-report': 'true' })).to.deep.eq({
      error: {
        code: 'PROPS_REQUIRED',
        message: 'pass --props with --full-report — only a command’s console properties are ever shortened',
      },
    })

    expect(getRunner).not.to.have.been.called
  })

  it('fails dispatch without reading the runner when a required option is missing', async () => {
    const getRunner = stubRunner({ getTestState: () => undefined })

    const manager = new TapManager(CYPRESS_VERSION)

    expect((await manager.exec('command', {}, { test: 'r2' }) as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')
    expect((await manager.exec('command', {}, { command: '1' }) as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')
    expect(getRunner).not.to.have.been.called
  })
})
