import { TapManager } from '../tap-manager'
import { tapRunnerSource } from './test-state'

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
  }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the runner seam rather than replace it.
  const stubRunner = (runner: unknown) => cy.stub(tapRunnerSource, 'getRunner').returns(runner)

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

  it('serializes every test via the __never__ sentinel, keeping only the lean entry fields', async () => {
    const getTestsState = cy.stub().returns(TESTS_STATE)

    stubRunner({ getTestsState })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('tests')

    expect(getTestsState).to.have.been.calledOnceWith('__never__')

    expect(outcome).to.deep.eq({
      result: [
        { id: 'r2', title: 'logs in', duration: 120, state: 'passed', retries: 1 },
        { id: 'r3', title: 'logs out', retries: 0, state: 'pending' },
      ],
    })
  })

  it('omits duration and retries of a test that has not run, defaults its state to pending, and round-trips through JSON', async () => {
    stubRunner({ getTestsState: () => ({ r2: { id: 'r2', title: 'logs in' } }) })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('tests')

    expect(outcome).to.deep.eq({
      result: [{ id: 'r2', title: 'logs in', state: 'pending' }],
    })

    expect(Object.keys((outcome as { result: object[] }).result[0])).to.deep.eq(['id', 'title', 'state'])
    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('fails dispatch without reading the runner when an unknown arg is given', async () => {
    const getRunner = stubRunner({ getTestsState: () => ({}) })

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
      const getTestsState = cy.stub().returns(DETAIL_STATE)

      stubRunner({ getTestsState })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'nope' })

      expect(getTestsState).to.have.been.calledOnceWith('__never__')
      expect(outcome).to.deep.eq({
        error: {
          code: 'TEST_NOT_FOUND',
          message: 'no test of this run matches the id "nope" — use the tests command to list this run’s tests',
        },
      })
    })

    it('returns the full title, timings, and trimmed error of the matching test via the __never__ sentinel', async () => {
      const getTestsState = cy.stub().returns(DETAIL_STATE)

      stubRunner({ getTestsState })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      // Must query with the sentinel, not 'r2': getTestsState excludes the matching id.
      expect(getTestsState).to.have.been.calledOnceWith('__never__')

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
    })

    it('omits duration, timings, and error for a known test that has not run, defaults its state to pending, and round-trips through JSON', async () => {
      stubRunner({ getTestsState: () => DETAIL_STATE })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r3' })

      expect(outcome).to.deep.eq({
        result: { id: 'r3', title: 'logs out', fullTitle: 'auth > logout > logs out', state: 'pending' },
      })

      expect(Object.keys((outcome as { result: object }).result)).to.deep.eq(['id', 'title', 'fullTitle', 'state'])
      expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
    })

    it('falls back to the plain title when the test carries no title path', async () => {
      stubRunner({ getTestsState: () => ({ r2: { id: 'r2', title: 'logs in' } }) })

      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('tests', { test: 'r2' })

      expect(outcome).to.deep.eq({
        result: { id: 'r2', title: 'logs in', fullTitle: 'logs in', state: 'pending' },
      })
    })
  })
})
