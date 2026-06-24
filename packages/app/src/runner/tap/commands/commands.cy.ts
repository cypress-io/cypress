import { TapManager } from '../tap-manager'
import { tapRunnerSource } from './test-state'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/commands', () => {
  // getTestsState returns every test keyed by id, each carrying its full
  // serialized command log. The fixture gives commands extra DISPLAY_PROPS
  // (displayName, hookId, …) to prove the handler keeps only the lean fields.
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'logs in',
      state: 'passed',
      commands: [
        { id: 'log-1', name: 'visit', message: '/login', state: 'passed', type: 'parent', displayName: 'visit', hookId: 'h1' },
        { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent' },
      ],
    },
    // A test that has not run yet carries no command log.
    r3: {
      id: 'r3',
      title: 'logs out',
    },
  }

  // The spec window's own `window.Cypress` is the instance running this
  // test, so every test stubs the runner seam instead of replacing it.
  const stubRunner = (runner: unknown) => cy.stub(tapRunnerSource, 'getRunner').returns(runner)

  it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
    stubRunner(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r2' })

    expect(outcome).to.deep.eq({
      ok: false,
      code: 'NO_RUN',
      message: 'no spec has been run yet — use the run command to run a spec first',
    })
  })

  it('fails with TEST_NOT_FOUND when no test of the run has that id', async () => {
    const getTestsState = cy.stub().returns(TESTS_STATE)

    stubRunner({ getTestsState })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'nope' })

    expect(getTestsState).to.have.been.calledOnceWith('__never__')
    expect(outcome).to.deep.eq({
      ok: false,
      code: 'TEST_NOT_FOUND',
      message: 'no test of this run matches the id "nope" — use the tests command to list this run’s tests',
    })
  })

  it('returns just the command log via the __never__ sentinel, keeping only the lean entry fields', async () => {
    const getTestsState = cy.stub().returns(TESTS_STATE)

    stubRunner({ getTestsState })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r2' })

    // '__never__' (not the test id) is the sentinel — getTestsState excludes
    // the matching id and everything after it, so passing 'r2' would drop it.
    expect(getTestsState).to.have.been.calledOnceWith('__never__')

    expect(outcome).to.deep.eq({
      ok: true,
      result: [
        { id: 'log-1', name: 'visit', message: '/login', state: 'passed', type: 'parent' },
        { id: 'log-2', name: 'get', message: '#user', state: 'passed', type: 'parent' },
      ],
    })
  })

  it('returns an empty command list for a known test that has not run yet, and round-trips through JSON', async () => {
    stubRunner({ getTestsState: () => TESTS_STATE })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands', {}, { test: 'r3' })

    expect(outcome).to.deep.eq({ ok: true, result: [] })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('fails dispatch without reading the runner when the required test option is missing', async () => {
    const getRunner = stubRunner({ getTestsState: () => ({}) })

    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('commands')

    expect(outcome).to.deep.include({ ok: false, code: 'INVALID_ARGUMENTS' })
    expect(getRunner).not.to.have.been.called
  })
})
