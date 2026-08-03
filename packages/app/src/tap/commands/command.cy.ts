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

  const TEST_BODY = { hookId: 'r2', hookName: 'test body' }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the runner seam rather than replace it.
  const stubRunner = (runner: unknown) => cy.stub(tapManagerDataSource, 'getRunner').returns(runner)

  const stubTests = (getSerializedConsolePropsForLog: unknown = () => undefined) => {
    return stubRunner({
      getTestState: (id: string) => TESTS_STATE[id],
      getSerializedConsolePropsForLog,
    })
  }

  // The snapshots come off the runner's own per-log lookup, a seam of its own —
  // left unstubbed, a row reports no snapshots.
  const stubSnapshots = (getSnapshotPropsForLog: unknown) => {
    return cy.stub(tapManagerDataSource, 'getSnapshotRunner').returns({ getSnapshotPropsForLog })
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

  it('returns one command entry, keeping only the listed fields', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: 'h1:1' })).to.deep.eq({
      result: { id: '1', name: 'visit', message: '/login', state: 'passed', type: 'parent', hook: { hookId: 'h1', hookName: 'before each' }, snapshots: [] },
    })
  })

  // A hook the attempt has not timed yet has no name to report, so the entry
  // carries the id alone rather than dropping the section entirely.
  it('names the hook a row ran in, falling back to its id alone', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: 'h1:1', attempt: '1' })).to.deep.eq({
      result: { id: '1', name: 'visit', message: '/login', state: 'passed', type: 'parent', hook: { hookId: 'h1' }, snapshots: [] },
    })
  })

  // Row numbers restart per section, so `1` names both the before-each visit and
  // the test body's first command; the test body is what an unqualified id means,
  // and it reports the reporter's own synthesized section.
  it('resolves a duplicated row number to the test body, not the hook', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent', hook: TEST_BODY, snapshots: [] },
    })
  })

  it('returns the entry from the requested attempt', async () => {
    stubTests()

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', attempt: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'failed', type: 'parent', hook: TEST_BODY, snapshots: [] },
    })
  })

  // The driver's snapshots are the handles `pin --at` takes, named or numbered,
  // and each carries the wall clock it was captured at.
  it('lists the row’s snapshots, looked up by the driver log id', async () => {
    stubTests()

    const getSnapshotPropsForLog = cy.stub().returns({
      url: 'http://localhost:3000/login',
      snapshots: [{ name: 'before', timestamp: 1767276202481.37 }, { name: 'after', timestamp: 1767276202613.81 }],
    })

    stubSnapshots(getSnapshotPropsForLog)

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      result: {
        id: '1',
        name: 'get',
        message: '#user',
        state: 'passed',
        type: 'parent',
        hook: TEST_BODY,
        snapshots: [{ index: 1, name: 'before', timestamp: 1767276202481 }, { index: 2, name: 'after', timestamp: 1767276202614 }],
      },
    })

    expect(getSnapshotPropsForLog).to.have.been.calledOnceWith('r2', 'log-2')
  })

  // The driver's memory cleanup nulls entries in place, and a single snapshot is
  // unnamed — neither is a snapshot the list can address.
  it('drops nulled snapshots and reports an unnamed one by position alone', async () => {
    stubTests()
    stubSnapshots(() => ({ snapshots: [null, { timestamp: 1767276202481 }] }))

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent', hook: TEST_BODY, snapshots: [{ index: 1, timestamp: 1767276202481 }] },
    })
  })

  it('reports no snapshots for a row the driver holds none for', async () => {
    stubTests()
    stubSnapshots(() => ({ snapshots: null }))

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent', hook: TEST_BODY, snapshots: [] },
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

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '9', attempt: '1' })).to.deep.eq({
      error: {
        code: 'COMMAND_NOT_FOUND',
        message: 'no command of this test matches the id "9" — use the reporter command (with --test) to list this test’s commands',
      },
    })

    expect(getSerializedConsolePropsForLog).not.to.have.been.called
  })

  // The driver keys its per-log details by its own log id, not by the row number
  // the reporter displays — so the handle has to be resolved before the lookup.
  it('returns JSON-safe console properties with the entry, looked up by the driver log id', async () => {
    const consoleProps = {
      name: 'get',
      type: 'command',
      props: {
        Selector: '#user',
        Elements: 1,
        Yielded: '<input#user>',
        body: '[12,480 characters withheld — pass --json to include it]',
      },
    }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubTests(getSerializedConsolePropsForLog)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-2', undefined)
    expect(outcome).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent', hook: TEST_BODY, snapshots: [], consoleProps },
    })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  // The app's console panel prints this note when it has no snapshot to show —
  // it says nothing about the command, and `snapshots` is what reports the ones
  // the row actually captured.
  it('drops the envelope’s console-panel snapshot note', async () => {
    stubTests(() => {
      return {
        name: 'get',
        type: 'command',
        props: { Selector: '#user' },
        snapshot: 'The snapshot is missing. Displaying current state of the DOM.',
      }
    })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })

    expect((outcome as { result: { consoleProps: unknown } }).result.consoleProps).to.deep.eq({
      name: 'get',
      type: 'command',
      props: { Selector: '#user' },
    })
  })

  it('selects console properties from the requested retry attempt', async () => {
    const consoleProps = { name: 'get', type: 'command', props: { Yielded: null } }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubTests(getSerializedConsolePropsForLog)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1', attempt: '1' })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-b', undefined)
    expect((outcome as { result: { consoleProps: unknown } }).result.consoleProps).to.deep.eq(consoleProps)
  })

  it('preserves the driver’s memory-cleanup message', async () => {
    const cleanup = { Message: 'The command details and snapshot has been cleaned up to reduce the number of tests in memory.' }

    stubTests(() => cleanup)

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r4', command: '1' })).to.deep.eq({
      result: {
        id: '1',
        name: 'visit',
        state: 'passed',
        type: 'parent',
        hook: { hookId: 'r4', hookName: 'test body' },
        cleanedUp: true,
        snapshots: [],
        consoleProps: cleanup,
      },
    })
  })

  // Details the driver no longer holds are simply absent — the row itself is
  // still worth reporting, so this is not a failure.
  it('omits console properties the driver has none of', async () => {
    stubTests(() => ({}))

    expect(await new TapManager(CYPRESS_VERSION).exec('command', {}, { test: 'r2', command: '1' })).to.deep.eq({
      result: { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent', hook: TEST_BODY, snapshots: [] },
    })
  })

  it('asks the driver for every value in full for --json', async () => {
    const consoleProps = { name: 'request', type: 'command', props: { body: { user: 'jane' } } }
    const getSerializedConsolePropsForLog = cy.stub().returns(consoleProps)

    stubTests(getSerializedConsolePropsForLog)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('command', {}, {
      'test': 'r2',
      'command': '1',
      'json': 'true',
    })

    expect(getSerializedConsolePropsForLog).to.have.been.calledOnceWith('r2', 'log-2', { full: true })
    expect((outcome as { result: { consoleProps: unknown } }).result.consoleProps).to.deep.eq(consoleProps)
  })

  it('fails dispatch without reading the runner when a required option is missing', async () => {
    const getRunner = stubRunner({ getTestState: () => undefined })

    const manager = new TapManager(CYPRESS_VERSION)

    expect((await manager.exec('command', {}, { test: 'r2' }) as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')
    expect((await manager.exec('command', {}, { command: '1' }) as { error: { code: string } }).error.code).to.eq('INVALID_OPTIONS')
    expect(getRunner).not.to.have.been.called
  })
})
