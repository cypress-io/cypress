/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import * as mocha from 'mocha'

import $Runner from '../../../src/cypress/runner'

// Match the import shape used by @packages/driver's cypress/mocha.ts
// so we exercise the same Mocha constructor the driver consumes.
const Mocha = (mocha as any).Mocha != null ? (mocha as any).Mocha : mocha
const { Runner, Suite, Test } = Mocha

describe('@packages/driver/src/cypress/runner', () => {
  const createdRealRunners: any[] = []

  afterEach(() => {
    // Dispose any real Mocha runners created during a test so their `process`
    // listeners don't bleed into subsequent tests.
    while (createdRealRunners.length) {
      try {
        createdRealRunners.pop().dispose()
      } catch { /* noop */ }
    }
  })

  // Minimal stubs for the arguments $Runner.create() expects. Each helper
  // returns just enough surface area for the factory to construct without
  // throwing; individual tests can override fields as needed.
  const makeCypressStub = () => {
    return {
      testingType: 'component',
      action: vi.fn(),
      emit: vi.fn(),
      emitThen: vi.fn(),
      config: vi.fn(() => false),
      env: vi.fn(() => undefined),
      state: vi.fn(),
      log: vi.fn(),
      isBrowser: vi.fn(() => false),
      browser: { family: 'chromium' },
      backend: vi.fn(),
      stop: vi.fn(),
    }
  }

  const makeCyStub = () => {
    return {
      state: vi.fn(),
      onUncaughtException: vi.fn(),
      currentTest: null,
      stop: vi.fn(),
    }
  }

  const makeStateStub = () => vi.fn()

  const makeSpecWindow = () => ({ addEventListener: vi.fn() }) as unknown as Window

  // Builds the `mocha` wrapper argument $Runner.create() expects, backed by
  // a real Mocha Runner so tests can observe real Mocha behavior.
  const makeMochaWrapper = () => {
    const suite = new Suite('root', {} as any)
    const runner = new Runner(suite)

    createdRealRunners.push(runner)

    return {
      wrapper: {
        getRunner: () => runner,
        getRootSuite: () => suite,
      },
      runner,
      suite,
    }
  }

  it('calls dispose() on the underlying mocha runner when the run completes', () => {
    const { wrapper, runner } = makeMochaWrapper()
    const disposeSpy = vi.spyOn(runner, 'dispose')

    const api = $Runner.create(
      makeSpecWindow(),
      wrapper,
      makeCypressStub(),
      makeCyStub(),
      makeStateStub(),
    )

    api.run(() => {})

    // Simulate mocha finishing the run by firing EVENT_RUN_END.
    // The callback registered by $Runner.run is what invokes dispose().
    runner.emit('end')

    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('removes the uncaughtException listener from `process` after a run completes', () => {
    const { wrapper, runner } = makeMochaWrapper()
    const baseline = process.listenerCount('uncaughtException')

    const api = $Runner.create(
      makeSpecWindow(),
      wrapper,
      makeCypressStub(),
      makeCyStub(),
      makeStateStub(),
    )

    // api.run → _runner.run(cb): mocha synchronously adds the
    // `uncaughtException` listener on `process` (mocha's runner.js) and
    // registers the EVENT_RUN_END handler that will invoke cb.
    api.run(() => {})

    expect(process.listenerCount('uncaughtException')).toBe(baseline + 1)

    // Simulate run completion: fires EVENT_RUN_END, which invokes our
    // callback, which calls _runner.dispose(), which removes the listener.
    runner.emit('end')

    expect(process.listenerCount('uncaughtException')).toBe(baseline)
  })

  describe('setTestFilter (test-level rerun keep-list)', () => {
    // normalizeAll reads the global `Cypress` (config/originalConfig), which the
    // driver provides at runtime but the unit harness does not.
    beforeEach(() => {
      (globalThis as any).Cypress = {
        config: () => false,
        originalConfig: {},
      }
    })

    afterEach(() => {
      delete (globalThis as any).Cypress
    })

    // Builds a runner whose root suite holds the given test titles, runs
    // normalizeAll so `_tests`/`_runner.suite` are populated, and returns the
    // api + suite + runner + test objects.
    const setupWithTests = (titles: string[]) => {
      const { wrapper, suite, runner } = makeMochaWrapper()

      const tests = titles.map((title) => {
        const test = new Test(title, () => {})

        suite.addTest(test)

        return test
      })

      const api = $Runner.create(
        makeSpecWindow(),
        wrapper,
        makeCypressStub(),
        makeCyStub(),
        makeStateStub(),
      )

      api.normalizeAll({}, true)

      return { api, suite, runner, tests }
    }

    it('prunes non-eligible tests from the Mocha suite tree', () => {
      const { api, suite, tests } = setupWithTests(['a fails', 'b passes', 'c skipped'])
      const [aFails, bPasses, cSkipped] = tests

      api.setTestFilter([aFails.fullTitle(), cSkipped.fullTitle()])

      // only the eligible tests remain in the tree, in order
      expect(suite.tests).toEqual([aFails, cSkipped])

      // the pruned test's body is discarded; survivors keep theirs
      expect(bPasses.fn).toBeUndefined()
      expect(typeof aFails.fn).toBe('function')
      expect(typeof cSkipped.fn).toBe('function')
    })

    it('prunes an emptied suite and clears its before/after hooks', () => {
      const { wrapper, suite: root } = makeMochaWrapper()

      const keep = new Test('keep me', () => {})

      root.addTest(keep)

      const nested = new Suite('nested', root.ctx)

      root.addSuite(nested)
      nested.beforeAll(() => {})
      nested.afterAll(() => {})
      nested.addTest(new Test('drop 1', () => {}))
      nested.addTest(new Test('drop 2', () => {}))

      const api = $Runner.create(
        makeSpecWindow(),
        wrapper,
        makeCypressStub(),
        makeCyStub(),
        makeStateStub(),
      )

      api.normalizeAll({}, true)
      api.setTestFilter([keep.fullTitle()])

      // the now-empty suite is detached, so Mocha never descends into it and
      // never runs its before/after hooks
      expect(root.suites).not.toContain(nested)
      expect(nested.parent).toBeNull()

      // cleanReferences removed the hook bodies as well
      expect(nested._beforeAll[0].fn).toBeUndefined()
      expect(nested._afterAll[0].fn).toBeUndefined()
    })

    it('reconciles the internal test list to only the surviving tests', () => {
      const { api, tests } = setupWithTests(['a fails', 'b passes', 'c skipped'])
      const [aFails, bPasses, cSkipped] = tests

      api.setTestFilter([aFails.fullTitle(), cSkipped.fullTitle()])

      // getTestsState walks the internal `_tests` list up to the given id; the
      // pruned test must not appear, proving `_tests` was reconciled with the
      // tree (so it never surfaces as a phantom "skipped" result downstream)
      const stateBeforeLast = api.getTestsState(cSkipped.id)

      expect(Object.keys(stateBeforeLast)).toEqual([aFails.id])
      expect(stateBeforeLast).not.toHaveProperty(bPasses.id)
    })

    it('is a no-op when the keep-list is empty (runs the whole spec)', () => {
      const { api, suite, tests } = setupWithTests(['a fails', 'b passes'])

      api.setTestFilter([])

      expect(suite.tests).toHaveLength(2)
      tests.forEach((test) => {
        expect(typeof test.fn).toBe('function')
      })
    })

    it('matches tests after stripping the "(skipped due to browser)" suffix', () => {
      const { api, suite, tests } = setupWithTests(['a test (skipped due to browser)', 'b test'])
      const [aTest, bTest] = tests

      // Cloud sends the sanitized title, so the keep-list has no suffix
      api.setTestFilter([aTest.fullTitle().replace(' (skipped due to browser)', '')])

      expect(suite.tests).toContain(aTest)
      expect(suite.tests).not.toContain(bTest)
    })

    it('remembers the keep-list (getTestFilter) so it can be re-applied after a reload', () => {
      const { api, tests } = setupWithTests(['a fails', 'b passes'])

      expect(api.getTestFilter()).toBeNull()

      const keepList = [tests[0].fullTitle()]

      api.setTestFilter(keepList)

      expect(api.getTestFilter()).toEqual(keepList)
    })
  })

  it('does not accumulate process listeners across multiple run/end cycles', () => {
    // Simulates the Cypress rerun lifecycle: each "rerun" creates a new
    // $Runner, calls api.run(), then ends. After each cycle, the process
    // listener count should return to baseline.
    const baseline = process.listenerCount('uncaughtException')

    for (let i = 0; i < 5; i++) {
      const { wrapper, runner } = makeMochaWrapper()

      const api = $Runner.create(
        makeSpecWindow(),
        wrapper,
        makeCypressStub(),
        makeCyStub(),
        makeStateStub(),
      )

      api.run(() => {})
      runner.emit('end')
    }

    expect(process.listenerCount('uncaughtException')).toBe(baseline)
  })
})
