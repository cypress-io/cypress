import _ from 'lodash'
import { expect, vi } from 'vitest'

type Fn = (...args: any[]) => any

type AsymmetricMatcher = { asymmetricMatch: (actual: unknown) => boolean }

const isAsymmetricMatcher = (value: unknown): value is AsymmetricMatcher => {
  return _.isObject(value) && 'asymmetricMatch' in value && _.isFunction(value.asymmetricMatch)
}

// sinon's deep equality lets a matcher such as `expect.any(Function)` stand in
// for a value at any depth.
const sinonEqual = (actual: unknown, expected: unknown) => {
  return _.isEqualWith(actual, expected, (a, e) => isAsymmetricMatcher(e) ? e.asymmetricMatch(a) : undefined)
}

// sinon's `calledWith` matches leading arguments only
export const callsStartingWith = (fn: Fn, ...args: unknown[]) => {
  return vi.mocked(fn).mock.calls.filter((call) => sinonEqual(call.slice(0, args.length), args))
}

export const expectCalledWith = (fn: Fn, ...args: unknown[]) => expect(callsStartingWith(fn, ...args)).not.toHaveLength(0)
