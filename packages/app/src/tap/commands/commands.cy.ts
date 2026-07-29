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
        { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent', hookId: 'r2' },
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

    // Ids are the reporter's own numbers, counted per hook section — the visit
    // (before-each) and the get (test body) are each row 1 of their section.
    expect(outcome).to.deep.eq({
      result: [
        { id: '1', name: 'visit', message: '/login', state: 'passed', type: 'parent' },
        { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent' },
      ],
    })
  })

  // Mirrors the serialized log shapes the driver emits for network commands:
  // a cy.intercept registration is bucketed under `routes` (instrument 'route'),
  // while the stubbed request, real request, and cy.request are `commands`. Each
  // carries its display detail on renderProps the way the reporter reads it, and
  // createdAtTimestamp drives the merge back into the run order the reporter
  // shows. r5 also holds an ordinary get to prove network fields stay absent on
  // non-network rows.
  const NETWORK_STATE = {
    r5: {
      id: 'r5',
      title: 'exercises the network',
      state: 'passed',
      routes: [
        {
          id: 'log-int', name: 'route', state: 'passed', type: 'parent', createdAtTimestamp: 1,
          instrument: 'route', method: 'GET', url: '/api/users',
          isStubbed: true, numResponses: 1, alias: 'getUsers', status: 200,
          message: undefined, renderProps: {},
        },
      ],
      commands: [
        {
          id: 'log-real', name: 'request', state: 'passed', type: 'parent', createdAtTimestamp: 3, event: true,
          displayName: 'xhr', message: '', method: 'POST', url: 'http://localhost:2121/track',
          renderProps: {
            indicator: 'bad', message: 'POST 500 /track', wentToOrigin: true, interceptions: [],
          },
        },
        {
          id: 'log-stub', name: 'request', state: 'passed', type: 'parent', createdAtTimestamp: 4, event: true,
          displayName: 'fetch', message: '', method: 'GET',
          url: 'http://localhost:2121/api/users', alias: 'getUsers', aliasType: 'route',
          renderProps: {
            indicator: 'successful', message: 'GET 200 /api/users',
            wentToOrigin: false,
            interceptions: [{ command: 'intercept', alias: 'getUsers', type: 'stub' }],
          },
        },
        { id: 'log-get', name: 'get', message: '#user', state: 'passed', type: 'parent', createdAtTimestamp: 5, url: 'http://localhost:2121/' },
        {
          id: 'log-req', name: 'request', state: 'passed', type: 'parent', createdAtTimestamp: 6,
          message: '', url: 'http://localhost:2121/',
          renderProps: { indicator: 'successful', message: 'GET 200 /api/data' },
        },
      ],
    },
  }

  it('merges intercept routes into the command log and surfaces high-level network info, leaving ordinary rows unchanged', async () => {
    stubRunner({ getTestState: (id: string) => NETWORK_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r5' })

    // The route registration (from `routes`) sorts to the front by timestamp,
    // ahead of the request rows it later matches — but routes aren't commands,
    // so it carries no id. The proxy request rows are events, taking `e` ids;
    // the ordinary get and the cy.request are the numbered rows.
    expect(outcome).to.deep.eq({
      result: [
        {
          name: 'route', state: 'passed', type: 'parent',
          network: { method: 'GET', url: '/api/users', status: 200, stubbed: true, numResponses: 1, alias: 'getUsers' },
        },
        {
          id: 'e1', name: 'request', message: 'POST 500 /track', state: 'passed', type: 'parent',
          network: { method: 'POST', url: 'http://localhost:2121/track', indicator: 'bad', stubbed: false },
        },
        {
          id: 'e2', name: 'request', message: 'GET 200 /api/users', state: 'passed', type: 'parent',
          network: { method: 'GET', url: 'http://localhost:2121/api/users', indicator: 'successful', stubbed: true, alias: 'getUsers' },
        },
        // The page URL on an ordinary get is not a request URL, so no network object.
        { id: '1', name: 'get', message: '#user', state: 'passed', type: 'parent' },
        // cy.request never sets a top-level method/request URL, so those stay in
        // the display message; only the status indicator is a structured field.
        {
          id: '2', name: 'request', message: 'GET 200 /api/data', state: 'passed', type: 'parent',
          network: { indicator: 'successful' },
        },
      ],
    })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('drops command fields nulled by the driver’s memory cleanup and marks the entry cleanedUp', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r4' })

    expect(outcome).to.deep.eq({
      result: [
        { id: '1', name: 'visit', state: 'passed', type: 'parent', cleanedUp: true },
      ],
    })
  })

  it('returns the requested attempt’s command log, 1-based (attempt 1 = first run, defaults to the latest)', async () => {
    stubRunner({ getTestState: (id: string) => TESTS_STATE[id] })

    const manager = new TapManager(CYPRESS_VERSION)

    // Ids are per attempt, so the failed first attempt numbers from 1 again
    // (its two rows share a section, unlike the latest attempt's).
    expect(await manager.exec('commands', {}, { test: 'r2', attempt: '1' })).to.deep.eq({
      result: [
        { id: '1', name: 'visit', message: '/login', state: 'passed', type: 'parent' },
        { id: '2', name: 'get', message: '#user', state: 'failed', type: 'parent' },
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
