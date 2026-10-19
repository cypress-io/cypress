import _ from 'lodash'

export const flattenSuiteIntoRunnables = (suite, tests: any[] = [], hooks: any[] = [], inheritedHooks: any[] = []) => {
  if (_.isArray(suite)) {
    return _.map(suite, (s) => flattenSuiteIntoRunnables(s, [], [], inheritedHooks))
    .reduce(
      (arr1, arr2) => [arr1[0].concat(arr2[0]), arr1[1].concat(arr2[1])],
      [tests, hooks],
    )
  }

  // if we dont have a suite, return early
  if (!suite || !suite.suites) {
    return [tests, hooks]
  }

  // union, not concat: when the command log is shown, the reporter has already merged these
  const suiteHooks = _.unionBy(suite.hooks, inheritedHooks, 'hookId')

  tests = tests.concat(_.map(suite.tests, (test) => {
    return { ...test, hooks: _.unionBy(test.hooks, suiteHooks, 'hookId') }
  }))

  hooks = hooks.concat(suite.hooks)

  if (suite.suites.length) {
    return flattenSuiteIntoRunnables(suite.suites, tests, hooks, suiteHooks)
  }

  return [tests, hooks]
}
