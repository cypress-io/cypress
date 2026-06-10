import '../../spec_helper'

import { flattenSuiteIntoRunnables } from '../../../lib/util/tests_utils'

const hook = (hookId: string) => {
  return { hookId, hookName: 'before each' }
}

const test = (id: string, hooks: any[] = []) => {
  return { id, title: `test ${id}`, hooks }
}

const suite = (id: string, tests: any[] = [], suites: any[] = [], hooks: any[] = []) => {
  return { id, title: `suite ${id}`, tests, suites, hooks }
}

const hookIds = (runnable: any) => runnable.hooks.map((h: any) => h.hookId)

describe('lib/util/tests_utils', () => {
  describe('.flattenSuiteIntoRunnables', () => {
    it('flattens all tests and hooks out of a nested suite tree', () => {
      const root = suite('r', [test('1')], [
        suite('s1', [test('2'), test('3')], [], [hook('h1')]),
        suite('s2', [test('4')], [], [hook('h2')]),
      ], [])

      const [tests, hooks] = flattenSuiteIntoRunnables(root)

      expect(tests.map((t) => t.id)).to.deep.equal(['1', '2', '3', '4'])
      expect(hooks.map((h) => h.hookId)).to.deep.equal(['h1', 'h2'])
    })

    it('associates each test with the hooks inherited from its ancestor suites', () => {
      const root = suite('r', [], [
        suite('s1', [test('1')], [
          suite('s1-1', [test('2')], [], [hook('h2')]),
        ], [hook('h1')]),
      ], [])

      const [tests] = flattenSuiteIntoRunnables(root)

      const test1 = tests.find((t) => t.id === '1')
      const test2 = tests.find((t) => t.id === '2')

      // test 1 only inherits the hook from its own suite
      expect(hookIds(test1)).to.deep.equal(['h1'])
      // test 2 inherits hooks from both ancestor suites (innermost first,
      // matching the reporter's union ordering)
      expect(hookIds(test2)).to.deep.equal(['h2', 'h1'])
    })

    it('includes hooks defined on the root suite', () => {
      const root = suite('r', [test('1')], [
        suite('s1', [test('2')], [], [hook('h2')]),
      ], [hook('h1')])

      const [tests] = flattenSuiteIntoRunnables(root)

      expect(hookIds(tests.find((t) => t.id === '1'))).to.deep.equal(['h1'])
      expect(hookIds(tests.find((t) => t.id === '2'))).to.deep.equal(['h2', 'h1'])
    })

    it('unions hooks defined directly on a test with inherited hooks without duplicating', () => {
      const root = suite('r', [], [
        suite('s1', [test('1', [hook('h1')])], [], [hook('h1'), hook('h2')]),
      ], [])

      const [tests] = flattenSuiteIntoRunnables(root)

      expect(hookIds(tests.find((t) => t.id === '1'))).to.deep.equal(['h1', 'h2'])
    })

    it('does not mutate the original runnable tree', () => {
      const childTest = test('1')
      const root = suite('r', [], [
        suite('s1', [childTest], [], [hook('h1')]),
      ], [])

      flattenSuiteIntoRunnables(root)

      expect(childTest.hooks).to.deep.equal([])
    })

    it('returns empty collections when there is no suite', () => {
      expect(flattenSuiteIntoRunnables(undefined)).to.deep.equal([[], []])
      expect(flattenSuiteIntoRunnables({})).to.deep.equal([[], []])
    })
  })
})
