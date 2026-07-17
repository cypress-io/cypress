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
          message: 'test "r2" has 2 attempt(s); pass --attempt 1–2 (defaults to the latest)',
        },
      })
    }
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

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_ARGUMENTS')
    expect(getRunner).not.to.have.been.called
  })
})
