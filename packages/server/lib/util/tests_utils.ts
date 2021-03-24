import _ from 'lodash'

export const flattenSuiteIntoRunnables = (suite, tests = [], hooks = []) => {
  if (_.isArray(suite)) {
    return _.map(suite, (s) => flattenSuiteIntoRunnables(s))
    .reduce(
      (arr1, arr2) => [arr1[0].concat(arr2[0]), arr1[1].concat(arr2[1])],
      [tests, hooks],
    )
  }

  // if we dont have a suite, return early
  if (!suite || !suite.suites) {
    return [tests, hooks]
  }

  tests = tests.concat(suite.tests)
  hooks = hooks.concat(suite.hooks)

  if (suite.suites.length) {
    return flattenSuiteIntoRunnables(suite.suites, tests, hooks)
  }

  return [tests, hooks]
}
