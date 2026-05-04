/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import * as mocha from 'mocha'

import $Runner from '../../../src/cypress/runner'

// Match the import shape used by @packages/driver's cypress/mocha.ts
// so we exercise the same Mocha constructor the driver consumes.
const Mocha = (mocha as any).Mocha != null ? (mocha as any).Mocha : mocha
const { Runner, Suite } = Mocha

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
