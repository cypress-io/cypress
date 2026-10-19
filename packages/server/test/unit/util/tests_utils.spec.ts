import { describe, it, expect } from 'vitest'
import { flattenSuiteIntoRunnables } from '../../../lib/util/tests_utils'

const hook = (hookId: string, hookName: string) => ({ hookId, hookName })

// mirrors the runnables the driver sends: each suite lists only its own hooks
const createRootRunnable = () => {
  return {
    id: 'r1',
    hooks: [hook('h1', 'before each')],
    tests: [{ id: 'r2', hooks: [] }],
    suites: [
      {
        id: 'r3',
        hooks: [hook('h2', 'before all'), hook('h3', 'before each')],
        tests: [{ id: 'r4', hooks: [] }],
        suites: [
          {
            id: 'r5',
            hooks: [hook('h4', 'after each')],
            tests: [{ id: 'r6', hooks: [] }],
            suites: [],
          },
        ],
      },
      {
        id: 'r7',
        hooks: [],
        tests: [{ id: 'r8', hooks: [] }],
        suites: [],
      },
    ],
  }
}

const hookIdsByTestId = (tests) => {
  return Object.fromEntries(tests.map((test) => [test.id, test.hooks.map((h) => h.hookId)]))
}

describe('lib/util/tests_utils', () => {
  describe('.flattenSuiteIntoRunnables', () => {
    it('flattens every test and hook in the suite tree', () => {
      const [tests, hooks] = flattenSuiteIntoRunnables(createRootRunnable())

      expect(tests.map((t) => t.id)).toEqual(['r2', 'r4', 'r6', 'r8'])
      expect(hooks.map((h) => h.hookId)).toEqual(['h1', 'h2', 'h3', 'h4'])
    })

    it('gives each test the hooks of its ancestor suites, nearest suite first', () => {
      const [tests] = flattenSuiteIntoRunnables(createRootRunnable())

      expect(hookIdsByTestId(tests)).toEqual({
        r2: ['h1'],
        r4: ['h2', 'h3', 'h1'],
        r6: ['h4', 'h2', 'h3', 'h1'],
        r8: ['h1'],
      })
    })

    it('matches the hooks the reporter merges into the runnables', () => {
      const runnable = createRootRunnable()
      const [nested] = runnable.suites
      const [deepest] = nested.suites

      nested.hooks = [...nested.hooks, ...runnable.hooks]
      nested.tests[0].hooks = nested.hooks
      deepest.hooks = [...deepest.hooks, ...nested.hooks]
      deepest.tests[0].hooks = deepest.hooks
      runnable.tests[0].hooks = runnable.hooks
      runnable.suites[1].tests[0].hooks = runnable.hooks

      const [tests] = flattenSuiteIntoRunnables(runnable)

      expect(hookIdsByTestId(tests)).toEqual(hookIdsByTestId(flattenSuiteIntoRunnables(createRootRunnable())[0]))
    })

    it('does not mutate the runnables', () => {
      const runnable = createRootRunnable()

      flattenSuiteIntoRunnables(runnable)

      expect(runnable).toEqual(createRootRunnable())
    })

    it('returns empty arrays without a suite', () => {
      expect(flattenSuiteIntoRunnables(undefined)).toEqual([[], []])
    })
  })
})
