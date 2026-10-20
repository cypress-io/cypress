import type { FoundSpec } from '@packages/types'

import { tapManagerDataSource } from '../tap-manager-data-source'
import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/run-state', () => {
  const RUN_MODE_SPECS: FoundSpec[] = [
    {
      name: 'login.cy.ts',
      relative: 'cypress/e2e/login.cy.ts',
      absolute: '/project/cypress/e2e/login.cy.ts',
      baseName: 'login.cy.ts',
      fileName: 'login',
      fileExtension: '.ts',
      specFileExtension: '.cy.ts',
      specType: 'integration',
    },
    {
      name: 'profile.cy.ts',
      relative: 'cypress/e2e/profile.cy.ts',
      absolute: '/project/cypress/e2e/profile.cy.ts',
      baseName: 'profile.cy.ts',
      fileName: 'profile',
      fileExtension: '.ts',
      specFileExtension: '.cy.ts',
      specType: 'integration',
    },
  ]

  // A test of each explicit outcome plus two that never ran. The driver sets
  // 'pending' explicitly for `it.skip` (r3); a test with no state set yet
  // (r4, r5) is pending mid-run and skipped once the run completes.
  const TESTS_STATE = {
    r1: { id: 'r1', title: 'passes', state: 'passed' },
    r2: { id: 'r2', title: 'fails', state: 'failed' },
    r3: { id: 'r3', title: 'is pending', state: 'pending' },
    r4: { id: 'r4', title: 'was cut off by the failure' },
    r5: { id: 'r5', title: 'has not run yet' },
  }

  const ONE_PASSING = { r1: { id: 'r1', title: 'passes', state: 'passed' } }

  const STARTED_AT = '2026-07-29T10:15:00.000Z'

  const runnerFacade = (tests: Record<string, { id: string, title: string, state?: string }>, isRunComplete: () => boolean, startedAt = STARTED_AT) => {
    return {
      getAllTestStates: () => Object.fromEntries(Object.entries(tests).map(([id, test]) => [id, test.state])),
      isRunComplete,
      getStartTime: () => startedAt,
    }
  }

  // The spec's own window.Cypress is the instance running this test, so stub
  // the seams rather than replace live state. `getRunner` only ever serves a
  // run that has started, so a stub always carries its start time.
  const stubRunner = (runner: ReturnType<typeof runnerFacade>) => {
    return cy.stub(tapManagerDataSource, 'getRunner').returns(runner)
  }
  const stubNoRunner = () => cy.stub(tapManagerDataSource, 'getRunner').returns(undefined)
  const stubActiveSpec = (relative: string | undefined) => cy.stub(tapManagerDataSource, 'getActiveSpecRelative').returns(relative)
  const stubScriptError = (error: string) => cy.stub(tapManagerDataSource, 'getScriptError').returns(error)

  beforeEach(() => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS
  })

  afterEach(() => {
    delete (window as any).__RUN_MODE_SPECS__
  })

  it('reports the spec list alone when no spec is selected', async () => {
    stubNoRunner()
    stubActiveSpec(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: { spec: null, totalSpecs: 2 },
    })
  })

  it('reports totalSpecs of 0 when the specs global is absent', async () => {
    delete (window as any).__RUN_MODE_SPECS__
    stubNoRunner()
    stubActiveSpec(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: { spec: null, totalSpecs: 0 },
    })
  })

  it('reports a selected spec whose run has not started as loading, with no counts to read as a verdict', async () => {
    stubNoRunner()
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'loading',
        startedAt: null,
      },
    })
  })

  it('reports a spec that failed to build as failed, carrying the failure instead of counts', async () => {
    // The runner is settled and empty — the shape a passing run of nothing has.
    stubRunner(runnerFacade({}, () => true))
    stubActiveSpec('cypress/e2e/login.cy.ts')
    stubScriptError('Error: Webpack Compilation Error\nSyntaxError: Unexpected token (4:2)\n    at Watching.handle (/x/webpack.js:1:1)')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'failed',
        startedAt: STARTED_AT,
        // No results to read as a clean sweep, and the compiler's own stack is
        // dropped — what identifies the failure is kept.
        error: 'Error: Webpack Compilation Error\nSyntaxError: Unexpected token (4:2)',
      },
    })
  })

  it('reports a build failure that kept the driver from booting at all', async () => {
    stubNoRunner()
    stubActiveSpec('cypress/e2e/login.cy.ts')
    stubScriptError('Error: Webpack Compilation Error')

    const manager = new TapManager(CYPRESS_VERSION)

    // Terminal, not loading: this spec is never going to start.
    expect(await manager.exec('run-state')).to.deep.eq({
      result: { spec: 'cypress/e2e/login.cy.ts', totalSpecs: 2, state: 'failed', startedAt: null, error: 'Error: Webpack Compilation Error' },
    })
  })

  it('reports a run in progress as running, with the active spec and partial results', async () => {
    stubRunner(runnerFacade(TESTS_STATE, () => false))
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'running',
        startedAt: STARTED_AT,
        totalTests: 5,
        // r4 and r5 never ran; mid-run they are pending, not yet skipped.
        results: { passed: 1, failed: 1, pending: 3, skipped: 0 },
      },
    })
  })

  it('reports an unsettled run with no failures as running, never a premature passed', async () => {
    stubRunner(runnerFacade(ONE_PASSING, () => false))
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'running',
        startedAt: STARTED_AT,
        totalTests: 1,
        results: { passed: 1, failed: 0, pending: 0, skipped: 0 },
      },
    })
  })

  it('reports a settled run with a failure as failed, counting never-run tests as skipped', async () => {
    stubRunner(runnerFacade(TESTS_STATE, () => true))
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'failed',
        startedAt: STARTED_AT,
        totalTests: 5,
        // r4 and r5 never ran; once the run has settled they are skipped.
        results: { passed: 1, failed: 1, pending: 1, skipped: 2 },
      },
    })
  })

  it('reports a settled run with no failures as passed', async () => {
    stubRunner(runnerFacade(ONE_PASSING, () => true))
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'passed',
        startedAt: STARTED_AT,
        totalTests: 1,
        results: { passed: 1, failed: 0, pending: 0, skipped: 0 },
      },
    })
  })

  it('names a verdict with the start time of the run it describes, so a superseded one is recognizable', async () => {
    const settled = runnerFacade(ONE_PASSING, () => true)
    const rerunStartedAt = '2026-07-29T10:16:30.000Z'

    stubRunner(settled).onSecondCall().returns({ ...settled, getStartTime: () => rerunStartedAt })
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    const first = await manager.exec('run-state') as { result: { startedAt: string } }
    const second = await manager.exec('run-state') as { result: { startedAt: string } }

    // Two runs of the same spec agree on every other field; the start time is
    // the whole of what tells them apart.
    expect(first.result.startedAt).to.eq(STARTED_AT)
    expect(second.result.startedAt).to.eq(rerunStartedAt)
  })

  it('reports a null spec when a run is readable but its path is not', async () => {
    stubRunner(runnerFacade({}, () => false))
    stubActiveSpec(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      result: { spec: null, totalSpecs: 2 },
    })
  })
})
