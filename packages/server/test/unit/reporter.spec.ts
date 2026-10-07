import { createRequire } from 'module'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'

import { Reporter } from '../../lib/reporter'

// `Reporter.loadReporter` reaches the built-in reporters through a CJS `require`,
// which `vi.mock` never sees, so seed the CJS cache instead.
const requireFromReporter = createRequire(path.join(__dirname, '../../lib/reporter.ts'))
const seededPaths: string[] = []

const seedCjsModule = (name: string, exports: unknown) => {
  const resolved = requireFromReporter.resolve(name)

  requireFromReporter.cache[resolved] = { exports } as NodeModule
  seededPaths.push(resolved)
}

const callsFor = (spy: MockInstance, event: string) => {
  return spy.mock.calls.filter((args) => args[0] === event)
}

describe('lib/reporter', () => {
  let reporter
  let root
  let testObj

  afterEach(() => {
    vi.restoreAllMocks()

    for (const p of seededPaths.splice(0)) {
      delete requireFromReporter.cache[p]
    }
  })

  beforeEach(() => {
    reporter = new Reporter()

    root = {
      id: 'r1',
      root: true,
      title: '',
      tests: [],
      suites: [
        {
          id: 'r2',
          title: 'TodoMVC - React',
          tests: [],
          suites: [
            {
              id: 'r3',
              title: 'When page is initially opened',
              tests: [
                {
                  id: 'r4',
                  title: 'should focus on the todo input field',
                  duration: 4,
                  state: 'failed',
                  timedOut: false,
                  async: 0,
                  sync: true,
                  err: {
                    message: 'foo',
                    stack: 'at foo:1:1\nat bar:1:1\nat baz:1:1',
                    codeFrame: {
                      line: 7,
                      column: 8,
                      originalFile: 'cypress/integration/spec.js',
                      relativeFile: 'cypress/integration/spec.js',
                      absoluteFile: '/path/to/cypress/integration/spec.js',
                      frame: '   5 | \n   6 |   it(\'fails\', () => {\n>  7 |     cy.get(\'nope\', { timeout: 1 })\n     |        ^\n   8 |   })\n   9 | })\n  10 | ',
                      language: 'js',
                    },
                  },
                },
                {
                  id: 'r5',
                  title: 'does something good',
                  duration: 4,
                  state: 'pending',
                  timedOut: false,
                  async: 0,
                  sync: true,
                },
              ],
              suites: [],
            },
          ],
        },
      ],
    }

    testObj = root.suites[0].suites[0].tests[0]

    reporter.setRunnables(root)
  })

  describe('.create', () => {
    it('can create mocha-teamcity-reporter', () => {
      const teamCityFn = vi.fn()

      seedCjsModule('mocha-teamcity-reporter', teamCityFn)

      const reporter = Reporter.create('teamcity')

      reporter.setRunnables(root)

      expect(reporter.reporterName).toBe('teamcity')

      expect(teamCityFn.mock.calls.some((args) => args[0] === reporter.runner)).toBe(true)
    })

    it('can create mocha-junit-reporter', () => {
      const junitFn = vi.fn()

      seedCjsModule('mocha-junit-reporter', junitFn)

      const reporter = Reporter.create('junit')

      reporter.setRunnables(root)

      expect(reporter.reporterName).toBe('junit')

      expect(junitFn.mock.calls.some((args) => args[0] === reporter.runner)).toBe(true)
    })
  })

  describe('createSuite', () => {
    it('recursively creates suites for fullTitle', () => {
      const args = reporter.parseArgs('fail', testObj)

      expect(args[0]).toBe('fail')

      const title = 'TodoMVC - React When page is initially opened should focus on the todo input field'

      expect(args[1].fullTitle()).toBe(title)
    })
  })

  describe('#stats', () => {
    it('has reporterName stats, reporterStats, etc', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1234)

      reporter.emit('test', testObj)
      reporter.emit('fail', testObj)
      reporter.emit('test end', testObj)

      reporter.reporterName = 'foo'

      expect(reporter.results()).toMatchSnapshot()
    })
  })

  describe('#setTestFilter', () => {
    const failedTitle = 'TodoMVC - React When page is initially opened should focus on the todo input field'
    const pendingTitle = 'TodoMVC - React When page is initially opened does something good'

    it('reports every test when no filter is set', () => {
      const { tests, stats } = reporter.results()

      expect(tests).toHaveLength(2)
      expect(stats.tests).toBe(2)
    })

    it('omits tests that are not in the keep-list from the reported results', () => {
      reporter.setTestFilter([failedTitle])

      const { tests, stats } = reporter.results()

      expect(tests).toHaveLength(1)
      expect(tests[0].testId).toBe('r4')
      expect(tests[0].title).toEqual([
        'TodoMVC - React',
        'When page is initially opened',
        'should focus on the todo input field',
      ])

      // stats reflect only the executed test — the filtered-out pending test is
      // not counted, consistent with how fully-skipped specs are omitted
      expect(stats.tests).toBe(1)
      expect(stats.failures).toBe(1)
      expect(stats.pending).toBe(0)
    })

    it('keeps every eligible test when multiple are in the keep-list', () => {
      reporter.setTestFilter([failedTitle, pendingTitle])

      const { tests } = reporter.results()

      expect(tests.map((t) => t.testId)).toEqual(['r4', 'r5'])
    })

    it('matches a test under a suite with an empty title, mirroring Mocha\'s native titlePath()', () => {
      const root = {
        id: 'e1',
        root: true,
        title: '',
        tests: [],
        suites: [
          {
            id: 'e2',
            title: '',
            tests: [
              {
                id: 'e3',
                title: 'runs',
                duration: 4,
                state: 'passed',
                timedOut: false,
                async: 0,
                sync: true,
              },
            ],
            suites: [],
          },
        ],
      }

      reporter.setRunnables(root)
      // matches Mocha's native `titlePath()`, which pushes the empty suite
      // title as its own segment (only the root suite is omitted)
      reporter.setTestFilter([' runs'])

      const { tests } = reporter.results()

      expect(tests.map((t) => t.testId)).toEqual(['e3'])
    })

    it('treats an empty keep-list as no filter', () => {
      reporter.setTestFilter([])

      expect(reporter.results().tests).toHaveLength(2)

      reporter.setTestFilter(undefined)

      expect(reporter.results().tests).toHaveLength(2)
    })

    it('is reset by setRunnables so a filter does not leak across specs', () => {
      reporter.setTestFilter([failedTitle])
      expect(reporter.results().tests).toHaveLength(1)

      reporter.setRunnables(root)
      expect(reporter.results().tests).toHaveLength(2)
    })
  })

  // https://github.com/cypress-io/cypress/issues/7139
  // Reporters that need to perform asynchronous work on completion must use
  // Mocha's `done(failures, callback)` hook (not the synchronous `end` event,
  // which Cypress cannot await). `Reporter#end` must wait for that callback
  // before resolving so the async work is not torn down by the run exiting.
  describe('#end', () => {
    it('waits for the reporter\'s async done() callback before resolving', () => {
      let doneFinished = false

      reporter.reporter.done = (failures, cb) => {
        setTimeout(() => {
          doneFinished = true
          cb()
        }, 50)
      }

      const endResult = reporter.end()

      // end() must return a promise (not resolve synchronously) when done() exists
      expect(endResult).toBeInstanceOf(Promise)

      return endResult.then((results) => {
        // if end() resolved before the callback fired, the async work would be lost
        expect(doneFinished, 'done() callback completed before end() resolved').toBe(true)
        expect(results).toHaveProperty('stats')
      })
    })

    it('passes the runner\'s failure count to done()', () => {
      reporter.runner.failures = 3

      const done = vi.fn((failures, cb) => cb())

      reporter.reporter.done = done

      return reporter.end().then(() => {
        expect(done.mock.calls.some((args) => args[0] === 3)).toBe(true)
      })
    })

    it('returns results synchronously when the reporter has no done() method', () => {
      // the default spec reporter does not implement done()
      expect(reporter.reporter.done).toBeUndefined()

      const results = reporter.end()

      expect(results).not.toBeInstanceOf(Promise)
      expect(results).toHaveProperty('stats')
    })
  })

  describe('#emit', () => {
    let emit: MockInstance

    beforeEach(() => {
      emit = vi.spyOn(reporter.runner, 'emit')
    })

    it('emits start', () => {
      reporter.emit('start', {})
      expect(callsFor(emit, 'start')).not.toHaveLength(0)

      expect(emit.mock.contexts).toContain(reporter.runner)
    })

    it('emits test with updated properties', () => {
      reporter.emit('test', { id: 'r5', state: 'passed' })
      expect(callsFor(emit, 'test')).not.toHaveLength(0)
      expect(emit.mock.calls[0][1].title).toBe('does something good')

      expect(emit.mock.calls[0][1].state).toBe('passed')
    })

    it('ignores events not in the events table', () => {
      reporter.emit('foo')

      expect(emit).not.toHaveBeenCalled()
    })

    it('sends suites with updated properties and nested subtree', () => {
      reporter.emit('suite', { id: 'r3', state: 'passed' })
      expect(callsFor(emit, 'suite')).not.toHaveLength(0)
      expect(emit.mock.calls[0][1].state).toBe('passed')

      expect(emit.mock.calls[0][1].tests.length).toBe(2)
    })
  })

  describe('#normalizeTest', () => {
    let reporter
    let test

    beforeEach(() => {
      reporter = new Reporter()
      test = {
        prevAttempts: [
          {
            err: {
              name: 'Error',
              message: 'There was an error',
            },
          },
        ],
      }
    })

    // https://github.com/cypress-io/cypress/issues/17378
    describe('attempt errors', () => {
      it('is null when error is undefined', () => {
        test.prevAttempts[0].err = undefined
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error).toBeNull()
      })

      it('stack is undefined when error is a string', () => {
        test.prevAttempts[0].err = 'There was an error'
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error.stack).toBeUndefined()
      })

      it('stack is undefined when undefined', () => {
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error.stack).toBeUndefined()
      })

      it('stack is an empty string when an empty string', () => {
        test.prevAttempts[0].err.stack = ''
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error.stack).toBe('')
      })
    })

    // https://github.com/cypress-io/cypress/issues/27956
    // The reporter UI derives non-terminal, display-only states (e.g. 'processing',
    // 'active') for tests that have not reached a terminal state. These are invalid
    // for Cypress Cloud and the Module API and are coerced to the terminal 'pending'
    // state rather than being reported as-is.
    describe('non-terminal test/attempt states', () => {
      it('coerces a `processing` test state to `pending`', () => {
        const result = reporter.normalizeTest({ id: 'r4', state: 'processing', prevAttempts: [] })

        expect(result.state).toBe('pending')
      })

      it('coerces a `processing` attempt state to `pending`', () => {
        const result = reporter.normalizeTest({ id: 'r4', state: 'processing', prevAttempts: [{ state: 'processing' }] })

        expect(result.attempts[0].state).toBe('pending')
        expect(result.attempts[1].state).toBe('pending')
      })

      it('coerces an `active` test state to `pending`', () => {
        const result = reporter.normalizeTest({ id: 'r4', state: 'active', prevAttempts: [] })

        expect(result.state).toBe('pending')
      })

      it('preserves terminal states', () => {
        for (const state of ['passed', 'failed', 'pending', 'skipped']) {
          const result = reporter.normalizeTest({ id: 'r4', state, prevAttempts: [{ state }] })

          expect(result.state).toBe(state)
          expect(result.attempts[0].state).toBe(state)
          expect(result.attempts[1].state).toBe(state)
        }
      })

      it('normalizes an unknown/undefined state to null', () => {
        expect(reporter.normalizeTest({ id: 'r4', prevAttempts: [] }).state).toBeNull()
        expect(reporter.normalizeTest({ id: 'r4', state: 'bogus', prevAttempts: [] }).state).toBeNull()
      })
    })
  })
})
