import _ from 'lodash'

// Associates a test with every hook that will run for it by unioning the
// test's own hooks with those inherited from its ancestor suites.
//
// This association normally happens as a side effect of initializing the
// reporter (see packages/reporter/src/runnables/runnables-store.ts), but the
// reporter is not initialized when the runner UI is hidden - which is the
// default while recording to the Cloud. Deriving the association here ensures
// the Cloud always receives accurate test/hook relationships regardless of
// whether the reporter ran, so tests aren't incorrectly flagged as "Modified"
// when their hooks haven't actually changed (#28119).
const associateHooksToTests = (tests, inheritedHooks) => {
  return _.map(tests, (test) => {
    return {
      ...test,
      hooks: _.unionBy(test.hooks, inheritedHooks, 'hookId'),
    }
  })
}

export const flattenSuiteIntoRunnables = (suite, tests: any[] = [], hooks: any[] = [], parentHooks: any[] = []) => {
  if (_.isArray(suite)) {
    return _.map(suite, (s) => flattenSuiteIntoRunnables(s, [], [], parentHooks))
    .reduce(
      (arr1, arr2) => [arr1[0].concat(arr2[0]), arr1[1].concat(arr2[1])],
      [tests, hooks],
    )
  }

  // if we dont have a suite, return early
  if (!suite || !suite.suites) {
    return [tests, hooks]
  }

  // combine the hooks defined directly on this suite with those inherited
  // from ancestor suites so descendants accumulate the full set of hooks
  const inheritedHooks = _.unionBy(suite.hooks, parentHooks, 'hookId')

  tests = tests.concat(associateHooksToTests(suite.tests, inheritedHooks))
  hooks = hooks.concat(suite.hooks)

  if (suite.suites.length) {
    return flattenSuiteIntoRunnables(suite.suites, tests, hooks, inheritedHooks)
  }

  return [tests, hooks]
}
