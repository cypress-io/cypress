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

// sinon's `calledWithMatch`: a top-level string matches as a substring and a
// top-level RegExp is tested against a string. An object matches when every key
// it names matches, and other nested values compare deeply.
const sinonMatches = (actual: unknown, expected: unknown, topLevel = true): boolean => {
  if (isAsymmetricMatcher(expected)) {
    return expected.asymmetricMatch(actual)
  }

  if (topLevel && _.isString(expected)) {
    return _.isString(actual) && actual.includes(expected)
  }

  if (topLevel && _.isRegExp(expected)) {
    return _.isString(actual) && expected.test(actual)
  }

  if (_.isPlainObject(expected)) {
    return _.isObject(actual) && _.every(expected, (value, key) => sinonMatches(actual[key], value, false))
  }

  return sinonEqual(actual, expected)
}

export const callsMatching = (fn: Fn, ...expected: unknown[]) => {
  return vi.mocked(fn).mock.calls.filter((call) => expected.every((e, i) => sinonMatches(call[i], e)))
}

// sinon's `calledWith` matches leading arguments only
export const callsStartingWith = (fn: Fn, ...args: unknown[]) => {
  return vi.mocked(fn).mock.calls.filter((call) => sinonEqual(call.slice(0, args.length), args))
}

export const expectCalledWith = (fn: Fn, ...args: unknown[]) => expect(callsStartingWith(fn, ...args)).not.toHaveLength(0)

export const expectNotCalledWith = (fn: Fn, ...args: unknown[]) => expect(callsStartingWith(fn, ...args)).toHaveLength(0)

export const expectCalledWithMatch = (fn: Fn, ...expected: unknown[]) => expect(callsMatching(fn, ...expected)).not.toHaveLength(0)

export const expectNotCalledWithMatch = (fn: Fn, ...expected: unknown[]) => expect(callsMatching(fn, ...expected)).toHaveLength(0)
