import _ from 'lodash'

import { filterAction as filterActionSchema, type FilterActionType, type TestAction_v1Type } from '../validations/cloudValidations'

// The `(skipped due to browser)` suffix is appended to a test's title by the
// driver when a suite-/test-level `browser` config skips it. Cloud records the
// original (sanitized) title, so strip the suffix before matching titles here.
// Keep in sync with `SKIPPED_DUE_TO_BROWSER_MESSAGE` in @packages/driver.
const SKIPPED_DUE_TO_BROWSER_MESSAGE = ' (skipped due to browser)'

const isFilterAction = (action: TestAction_v1Type): action is FilterActionType => {
  return filterActionSchema.safeParse(action).success
}

/**
 * Given the `actions` from a `postInstanceTests` response, compute the keep-list
 * of test full titles the runner should execute for this spec.
 *
 * Returns `undefined` when there is no FILTER action (i.e. test-level filtering
 * is not armed for this run/spec), signalling the runner to execute the spec in
 * full. When a FILTER action is present, returns the full titles of the eligible
 * tests — those whose status is included in the action's `filter`.
 */
export const getEligibleTestTitles = (actions: TestAction_v1Type[] | null | undefined): string[] | undefined => {
  const filterAction = _.find(actions, isFilterAction)

  if (!filterAction) {
    return undefined
  }

  const { filter, tests } = filterAction.payload

  return _.chain(tests)
  .filter((test) => filter.includes(test.status))
  .map((test) => test.titleParts.join(' ').replaceAll(SKIPPED_DUE_TO_BROWSER_MESSAGE, ''))
  .value()
}

/**
 * Cloud supplies the warning copy to display for the rerun (e.g. explaining
 * which statuses are being re-run), so the FILTER action's `message` is used
 * rather than a hard-coded string here.
 */
export const getFilterMessage = (actions: TestAction_v1Type[] | null | undefined): string | undefined => {
  const filterAction = _.find(actions, isFilterAction)

  return filterAction?.payload.message ?? undefined
}
