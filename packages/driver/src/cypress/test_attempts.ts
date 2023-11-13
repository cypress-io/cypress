export const testAttemptFinished = ({ runner, test, tests, err, constants, next }) => {
  if (!err && !test.hasAttemptPassed) {
    return false
  }

  const { STATE_PASSED, STATE_FAILED, HOOK_TYPE_AFTER_EACH } = constants

  if (test.hasAttemptPassed) {
    // Currently, to get passing attempts to rerun in mocha,
    // we signal to mocha that we MIGHT need to retry a passed test attempt.
    // If the test is run and there are no errors present, we assume a
    // passed test attempt(set in ./driver/src/cypress/runner.ts)
    test.state = STATE_PASSED
  } else {
    // Otherwise, we can assume the test attempt failed as 'err' would have to be present here.
    test.state = STATE_FAILED
  }

  // Evaluate if the test should continue based on 'calculateTestStatus'.
  // This is a custom method added by Cypress in ./driver/src/cypress/mocha.ts
  let testStatusInfo = test.calculateTestStatus()

  if (!testStatusInfo.shouldAttemptsContinue) {
    // If the test has met the exit condition, we need to grab the metadata from
    // 'calculateTestStatus' in order to display and interpret the test outerStatus correctly.
    test._cypressTestStatusInfo = testStatusInfo

    if (testStatusInfo.attempts > 1) {
      // If the test has been run AT LEAST twice (i.e. we are retrying), and the exit condition is met,
      // modify mocha '_retries' to be the max retries made in order to possibly short circuit a suite
      // if a hook has failed on every attempt (which we may not know at this stage of the test run).

      // We will need the original retries to 'reset' the possible retries
      // if the test attempt passes and fits the exit condition, BUT an 'afterEach' hook fails.
      // In this case, we need to know how many retries we can reapply to satisfy the config.
      test._maxRetries = test._retries
      test._retries = test._currentRetry
    }
  }

  let retry = test.currentRetry()

  // TODO: refactor this
  // requeue the test if we have retries and haven't satisfied our retry configuration.
  if (retry < test.retries() && testStatusInfo.shouldAttemptsContinue) {
    let clonedTest = test.clone()

    clonedTest.currentRetry(retry + 1)
    tests.unshift(clonedTest)

    runner.emit(constants.EVENT_TEST_RETRY, test, err)

    // Early return + hook trigger so that it doesn't
    // increment the count wrong
    return runner.hookUp(HOOK_TYPE_AFTER_EACH, next)
  // TODO: refactor this
  }

  if (testStatusInfo.outerStatus === STATE_FAILED) {
    // However, if we have fit the exit condition and the outerStatus of the test is marked as 'failed'.

    // We need to check the state of the last test attempt.
    // In this case, if the strategy is "detect-flake-but-always-fail",
    // has an outerStatus of 'failed', but the last test attempt passed, we still want to call the 'fail' hooks on the test, but keep
    // the test attempt marked as passed.

    // However, since the test might have afterEach/after hooks that mutate the state of the test
    // (from passed to failed), the hooks might actually affect how many retries are actually run in order to satisfy the config.
    // In this case, we want to delay failing as long as possible to make sure the test is settled, all attempts are run, and hooks
    // can no longer retry. For this edge case specifically, the failing of the test in the runner lives in ./driver/src/cypress/runner.ts
    if (test.state === STATE_FAILED) {
      runner.fail(test, err)
    }
  } else if (testStatusInfo?.outerStatus === STATE_PASSED) {
    // There is no case where a test can 'pass' and the last test attempt be a failure,
    // meaning we can assume a 'passed' outerStatus has a final passed test attempt.
    runner.emit(constants.EVENT_TEST_PASS, test)
  }

  runner.emit(constants.EVENT_TEST_END, test)

  return runner.hookUp(HOOK_TYPE_AFTER_EACH, next)
}
