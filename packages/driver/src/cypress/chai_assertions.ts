// chai 5.2+ has `iterable` and `containSubset` built in. Cypress runs chai 4,
// so it adds them with chai's names, matching rules and messages, letting tests
// written for them keep passing once Cypress upgrades chai. The exceptions are
// noted where they occur.
import _ from 'lodash'

const isIterable = (obj) => {
  try {
    return obj != null && typeof obj[Symbol.iterator] === 'function'
  } catch (err) {
    // A cross-origin window refuses to have its Symbol.iterator read, and is
    // not iterable.
    if (err?.name === 'SecurityError') {
      return false
    }

    throw err
  }
}

const compareSubset = (expected: unknown, actual: unknown): boolean => {
  if (expected === actual) {
    return true
  }

  if (typeof actual !== typeof expected) {
    return false
  }

  if (typeof expected !== 'object' || expected === null) {
    return expected === actual
  }

  if (!actual) {
    return false
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return false
    }

    return expected.every((exp) => actual.some((act) => compareSubset(exp, act)))
  }

  // `_.isDate` rather than chai's `instanceof Date`, which is false for dates
  // that spec code creates in its own realm.
  if (_.isDate(expected)) {
    return _.isDate(actual) && expected.getTime() === actual.getTime()
  }

  return Object.keys(expected).every((key) => {
    const expectedValue = expected[key]
    const actualValue = actual[key]

    if (typeof expectedValue === 'object' && expectedValue !== null && actualValue !== null) {
      return compareSubset(expectedValue, actualValue)
    }

    if (typeof expectedValue === 'function') {
      return expectedValue(actualValue)
    }

    return actualValue === expectedValue
  })
}

export const $chaiAssertions = (chai: Chai.ChaiStatic, chaiUtils: Chai.ChaiUtils) => {
  const { Assertion, assert } = chai

  Assertion.addProperty('iterable', function () {
    const obj = chaiUtils.flag(this, 'object')

    this.assert(
      isIterable(obj),
      'expected #{this} to be an iterable',
      'expected #{this} to not be an iterable',
      obj,
    )
  })

  Assertion.addMethod('containSubset', function (expected) {
    const actual = chaiUtils.flag(this, 'object')

    this.assert(
      compareSubset(expected, actual),
      'expected #{act} to contain subset #{exp}',
      'expected #{act} to not contain subset #{exp}',
      expected,
      actual,
      chai.config.showDiff,
    )
  })

  // chai throws from `assert.isIterable` directly. Going through an Assertion
  // instead shows the result in the Command Log, as other assert methods do,
  // and prefixes a custom message with `message: ` rather than `message `.
  assert.isIterable = function (obj, msg) {
    new Assertion(obj, msg, assert.isIterable, true).to.be.iterable
  }

  assert.containsSubset = function (val, exp, msg) {
    new Assertion(val, msg, assert.containsSubset, true).to.containSubset(exp)
  }

  assert.containSubset = assert.containsSubset

  assert.doesNotContainSubset = function (val, exp, msg) {
    new Assertion(val, msg, assert.doesNotContainSubset, true).to.not.containSubset(exp)
  }
}
