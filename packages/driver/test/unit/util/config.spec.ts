/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'

import { getMochaOverrideLevel } from '../../../src/util/config'

const makeState = (values: Record<string, any>) => {
  return (key: string) => values[key]
}

describe('src/util/config', () => {
  describe('getMochaOverrideLevel', () => {
    it('returns the applied override level when outside of user test execution', () => {
      const state = makeState({
        duringUserTestExecution: false,
        test: { _testConfig: { applied: 'suite' } },
      })

      expect(getMochaOverrideLevel(state)).toEqual('suite')
    })

    it('returns undefined during user test execution', () => {
      const state = makeState({
        duringUserTestExecution: true,
        test: { _testConfig: { applied: 'suite' } },
      })

      expect(getMochaOverrideLevel(state)).toBeUndefined()
    })

    it('returns undefined once the test has fired lifecycle events', () => {
      const state = makeState({
        duringUserTestExecution: false,
        test: { _fired: { 'test:before:run': true }, _testConfig: { applied: 'suite' } },
      })

      expect(getMochaOverrideLevel(state)).toBeUndefined()
    })

    // Reproduces the cross-origin flake where config is synced to a secondary
    // origin spec bridge whose `test` is a placeholder object without `_testConfig`.
    // Previously this threw `Cannot read properties of undefined (reading 'applied')`.
    it('does not throw when the test object has no _testConfig (secondary origin)', () => {
      const state = makeState({
        duringUserTestExecution: false,
        test: {},
      })

      expect(() => getMochaOverrideLevel(state)).not.toThrow()
      expect(getMochaOverrideLevel(state)).toBeUndefined()
    })
  })
})
