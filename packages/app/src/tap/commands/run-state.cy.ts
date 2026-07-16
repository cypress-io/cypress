import type { FoundSpec } from '@packages/types'

import { tapManagerDataSource } from '../tap-manager-data-source'
import { TapManager } from '../tap-manager'
import { tapRunStateSource } from './run-state'

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

  // The spec's own window.Cypress is the instance running this test, so stub
  // the seams rather than replace live state.
  const stubRunner = (runner: unknown) => cy.stub(tapManagerDataSource, 'getRunner').returns(runner)
  const stubRunning = (isRunning: boolean) => cy.stub(tapRunStateSource, 'isRunning').returns(isRunning)
  const stubActiveSpec = (relative: string | undefined) => cy.stub(tapRunStateSource, 'getActiveSpecRelative').returns(relative)

  beforeEach(() => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS
  })

  afterEach(() => {
    delete (window as any).__RUN_MODE_SPECS__
  })

  it('reports the spec list (no run) without the run-only fields', async () => {
    stubRunner(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      ok: true,
      result: { spec: null, totalSpecs: 2 },
    })
  })

  it('reports totalSpecs of 0 when the specs global is absent', async () => {
    delete (window as any).__RUN_MODE_SPECS__
    stubRunner(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      ok: true,
      result: { spec: null, totalSpecs: 0 },
    })
  })

  it('reports a run in progress as running, with the active spec and partial results', async () => {
    stubRunner({ getAllTestsState: cy.stub().returns(TESTS_STATE), isRunComplete: () => false })
    stubRunning(true)
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      ok: true,
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'running',
        totalTests: 5,
        // r4 and r5 never ran; mid-run they are pending, not yet skipped.
        results: { passed: 1, failed: 1, pending: 3, skipped: 0 },
      },
    })
  })

  it('reports a settled run with a failure as failed, counting never-run tests as skipped', async () => {
    stubRunner({ getAllTestsState: cy.stub().returns(TESTS_STATE), isRunComplete: () => true })
    stubRunning(false)
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      ok: true,
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'failed',
        totalTests: 5,
        // r4 and r5 never ran; once the run has settled they are skipped.
        results: { passed: 1, failed: 1, pending: 1, skipped: 2 },
      },
    })
  })

  it('reports a settled run with no failures as passed', async () => {
    stubRunner({ getAllTestsState: cy.stub().returns({ r1: { id: 'r1', title: 'passes', state: 'passed' } }), isRunComplete: () => true })
    stubRunning(false)
    stubActiveSpec('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      ok: true,
      result: {
        spec: 'cypress/e2e/login.cy.ts',
        totalSpecs: 2,
        state: 'passed',
        totalTests: 1,
        results: { passed: 1, failed: 0, pending: 0, skipped: 0 },
      },
    })
  })

  it('falls back to a null spec when the active spec path is unavailable', async () => {
    stubRunner({ getAllTestsState: cy.stub().returns({}), isRunComplete: () => false })
    stubRunning(true)
    stubActiveSpec(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('run-state')).to.deep.eq({
      ok: true,
      result: {
        spec: null,
        totalSpecs: 2,
        state: 'running',
        totalTests: 0,
        results: { passed: 0, failed: 0, pending: 0, skipped: 0 },
      },
    })
  })
})
