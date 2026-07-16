import { tapManagerDataSource } from '../TapManagerDataSource'
import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/tests', () => {
  // The fixture includes extras to prove the handler strips them — notably
  // input `retries` (configured max), distinct from output `retries` (currentRetry).
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'logs in',
      duration: 120,
      state: 'passed',
      retries: 2,
      currentRetry: 1,
      body: 'function () {}',
      timings: { lifecycle: 30 },
      prevAttempts: [{ id: 'r2', state: 'failed' }],
    },
    r3: {
      id: 'r3',
      title: 'logs out',
      retries: 2,
      currentRetry: 0,
      body: 'function () {}',
    },
    // The driver sets 'pending' explicitly for `it.skip` — distinct from r3,
    // which has no state because it never ran and comes back 'skipped'.
    r4: {
      id: 'r4',
      title: 'stays logged in',
      state: 'pending',
    },
  }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the runner seam rather than replace it. Fixtures stand for a completed run
  // by default; a test overrides isRunComplete to exercise the mid-run path.
  const stubRunner = (runner: unknown) => {
    return cy.stub(tapManagerDataSource, 'getRunner').returns(
      runner && typeof runner === 'object' ? { isRunComplete: () => true, ...runner } : runner,
    )
  }

  it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
    stubRunner(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('tests')

    expect(outcome).to.deep.eq({
      error: {
        code: 'NO_RUN',
        message: 'no spec has been run yet — use the run command to run a spec first',
      },
    })
  })

  it('serializes every test, keeping only the lean entry fields', async () => {
    const getAllTestsState = cy.stub().returns(TESTS_STATE)

    stubRunner({ getAllTestsState })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('tests')

    expect(getAllTestsState).to.have.been.calledOnce

    expect(outcome).to.deep.eq({
      result: [
        { id: 'r2', title: 'logs in', duration: 120, state: 'passed', retries: 1 },
        { id: 'r3', title: 'logs out', retries: 0, state: 'skipped' },
        { id: 'r4', title: 'stays logged in', state: 'pending' },
      ],
    })
  })

  it('reports a test with no state yet as pending while the run is still going, skipped once it completes', async () => {
    const state = { r3: { id: 'r3', title: 'logs out' } }

    const getRunner = stubRunner({ getAllTestsState: () => state, isRunComplete: () => false })

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('tests')).to.deep.eq({
      result: [{ id: 'r3', title: 'logs out', state: 'pending' }],
    })

    // Re-program the existing stub: a second cy.stub on the same method throws.
    getRunner.returns({ getAllTestsState: () => state, isRunComplete: () => true })

    expect(await new TapManager(CYPRESS_VERSION).exec('tests')).to.deep.eq({
      result: [{ id: 'r3', title: 'logs out', state: 'skipped' }],
    })
  })

  it('omits duration and retries of a test that never ran, defaults its state to skipped, and round-trips through JSON', async () => {
    stubRunner({ getAllTestsState: () => ({ r2: { id: 'r2', title: 'logs in' } }) })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('tests')

    expect(outcome).to.deep.eq({
      result: [{ id: 'r2', title: 'logs in', state: 'skipped' }],
    })

    expect(Object.keys((outcome as { result: object[] }).result[0])).to.deep.eq(['id', 'title', 'state'])
    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('fails dispatch without reading the runner when an unknown arg is given', async () => {
    const getRunner = stubRunner({ getAllTestsState: () => ({}) })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('tests', { test: 'r2', extra: 'extra' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_ARGUMENTS')
    expect(getRunner).not.to.have.been.called
  })

  describe('with a test id', () => {
    // Includes fields the list omits plus error extras (codeFrame) to prove
    // the detail trims the error down to its messaging fields.
    const DETAIL_STATE = {
      r2: {
        id: 'r2',
        title: 'logs in',
        _titlePath: ['auth', 'login', 'logs in'],
        duration: 120,
        state: 'failed',
        currentRetry: 1,
        timings: { lifecycle: 30, 'before each': [{ hookId: 'h1', fnDuration: 5 }] },
        err: {
          name: 'AssertionError',
          message: 'expected true to be false',
          stack: 'AssertionError: expected true to be false\n  at <anonymous>',
          codeFrame: { line: 3 },
        },
      },
      r3: {
        id: 'r3',
        title: 'logs out',
        _titlePath: ['auth', 'logout', 'logs out'],
      },
    }

    it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
      stubRunner(undefined)

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      expect(outcome).to.deep.eq({
        error: {
          code: 'NO_RUN',
          message: 'no spec has been run yet — use the run command to run a spec first',
        },
      })
    })

    it('fails with TEST_NOT_FOUND when no test of the run has that id', async () => {
      const getAllTestsState = cy.stub().returns(DETAIL_STATE)

      stubRunner({ getAllTestsState })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'nope' })

      expect(getAllTestsState).to.have.been.calledOnce
      expect(outcome).to.deep.eq({
        error: {
          code: 'TEST_NOT_FOUND',
          message: 'no test of this run matches the id "nope" — use the tests command to list this run’s tests',
        },
      })
    })

    it('returns the full title, timings, and trimmed error of the matching test', async () => {
      const getAllTestsState = cy.stub().returns(DETAIL_STATE)

      stubRunner({ getAllTestsState })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      expect(getAllTestsState).to.have.been.calledOnce

      expect(outcome).to.deep.eq({
        result: {
          id: 'r2',
          title: 'logs in',
          fullTitle: 'auth > login > logs in',
          duration: 120,
          state: 'failed',
          retries: 1,
          timings: { lifecycle: 30, 'before each': [{ hookId: 'h1', fnDuration: 5 }] },
          error: {
            name: 'AssertionError',
            message: 'expected true to be false',
            stack: 'AssertionError: expected true to be false\n  at <anonymous>',
          },
        },
      })

      // A snapshot, not the driver's live timings object.
      expect((outcome as { result: { timings: object } }).result.timings).to.not.equal(DETAIL_STATE.r2.timings)
    })

    it('omits duration, timings, and error for a known test that never ran, defaults its state to skipped, and round-trips through JSON', async () => {
      stubRunner({ getAllTestsState: () => DETAIL_STATE })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r3' })

      expect(outcome).to.deep.eq({
        result: { id: 'r3', title: 'logs out', fullTitle: 'auth > logout > logs out', state: 'skipped' },
      })

      expect(Object.keys((outcome as { result: object }).result)).to.deep.eq(['id', 'title', 'fullTitle', 'state'])
      expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
    })

    it('falls back to the plain title when the test carries no title path', async () => {
      stubRunner({ getAllTestsState: () => ({ r2: { id: 'r2', title: 'logs in' } }) })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      expect(outcome).to.deep.eq({
        result: { id: 'r2', title: 'logs in', fullTitle: 'logs in', state: 'skipped' },
      })
    })

    it('treats null err and timings as absent rather than crashing on them', async () => {
      stubRunner({ getAllTestsState: () => ({ r2: { id: 'r2', title: 'logs in', state: 'passed', err: null, timings: null } }) })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      expect(outcome).to.deep.eq({
        result: { id: 'r2', title: 'logs in', fullTitle: 'logs in', state: 'passed' },
      })
    })

    it('drops non-string error props, which a non-Error user throw can carry', async () => {
      stubRunner({
        getAllTestsState: () => {
          return {
            r2: { id: 'r2', title: 'logs in', state: 'failed', err: { name: 42, message: 'thrown', stack: undefined } },
          }
        },
      })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      expect(outcome).to.deep.eq({
        result: { id: 'r2', title: 'logs in', fullTitle: 'logs in', state: 'failed', error: { message: 'thrown' } },
      })
    })
  })
})
