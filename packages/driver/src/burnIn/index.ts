export type Strategy = 'detect-flake-and-pass-on-threshold' | 'detect-flake-but-always-fail' | undefined

export type NormalizedRetriesConfig = {
  strategy?: Strategy
  maxRetries?: number
  passesRequired?: number
  stopIfAnyPassed?: boolean
}

export type CompleteBurnInConfig = {
  enabled: boolean
  default: number
  flaky: number
}

export type LatestScore = null | -2 | -1 | 0 | 1

export type AttemptStrategy = 'RETRY' | 'BURN_IN' | 'NONE'

export type ReasonToStop =
| 'PASSED_FIRST_ATTEMPT' // no burn-in needed
| 'PASSED_BURN_IN' // achieved burn-in
| 'PASSED_MET_THRESHOLD' // passed after reaching threshold for strategy 'detect-flake-and-pass-on-threshold'
| 'FAILED_NO_RETRIES' // failed and no retries
| 'FAILED_REACHED_MAX_RETRIES' // failed after reaching max retries
| 'FAILED_DID_NOT_MEET_THRESHOLD' // failed since it's impossible to meet threshold for strategy 'detect-flake-and-pass-on-threshold'
| 'FAILED_STOPPED_ON_FLAKE' // failed with one attempt passing and using strategy 'detect-flake-but-always-fail' with `stopIfAnyPassed` set to true
// NOTE: can we detect this? how? the goal is to avoid retrying a test that failed because of a hook failure
| 'FAILED_HOOK_FAILED' // failed because a hook failed

export type EvaluateAttemptInput = {
  retriesConfig: NormalizedRetriesConfig
  burnInConfig: CompleteBurnInConfig
  latestScore: LatestScore
  passedAttemptsCount: number
  failedAttemptsCount: number
  currentAttemptResult?: string
  potentialInitialStrategy?: AttemptStrategy
  maxAttempts: number
}

export type EvaluateAttemptOutput = {
  initialStrategy: AttemptStrategy
  nextInitialStrategy?: AttemptStrategy
  final: boolean
  forceState?: 'passed'
  reasonToStop?: ReasonToStop
  outerTestStatus?: 'passed' | 'failed'
}

export function getNeededBurnInAttempts (latestScore: LatestScore, burnInConfig: CompleteBurnInConfig) {
  if (burnInConfig.enabled === false) {
    return 0
  }

  switch (latestScore) {
    case null: return burnInConfig.default // this means the cloud determined the test is new or modified
    case 0: return burnInConfig.default // this means the cloud determined the test was failing with no flake
    case -1: return burnInConfig.flaky // this means the cloud determined the test was flaky
    case -2: return 0 // this means the cloud couldn't determine the score
    case 1: return 0 // this means the cloud determined the test graduated burn-in
    default: return 0
  }
}

export function evaluateAttempt (input: EvaluateAttemptInput) {
  const {
    latestScore,
    burnInConfig,
    passedAttemptsCount,
    failedAttemptsCount,
    potentialInitialStrategy,
    retriesConfig,
    maxAttempts,
    currentAttemptResult,
  } = input

  const result: EvaluateAttemptOutput = { final: true, initialStrategy: potentialInitialStrategy ?? 'NONE' }

  const totalAttemptsAlreadyExecuted = passedAttemptsCount + failedAttemptsCount

  // If there is AT LEAST one failed test attempt, we know we need to apply retry logic.
  // Otherwise, the test might be burning in (not implemented yet) OR the test passed on the first attempt,
  // meaning retry logic does NOT need to be applied.
  if (failedAttemptsCount > 0) {
    result.nextInitialStrategy = 'RETRY'
    const remainingAttempts = maxAttempts - totalAttemptsAlreadyExecuted

    // Below variables are used for when strategy is "detect-flake-and-pass-on-threshold" or no strategy is defined
    let passesRequired = retriesConfig?.strategy !== 'detect-flake-but-always-fail' ?
      (retriesConfig.passesRequired || 1) :
      null

    const neededPassingAttemptsLeft = retriesConfig.strategy !== 'detect-flake-but-always-fail' ?
      (passesRequired as number) - passedAttemptsCount :
      null

    // Below variables are used for when strategy is only "detect-flake-but-always-fail"
    let stopIfAnyPassed = retriesConfig.strategy === 'detect-flake-but-always-fail' ?
      (retriesConfig.stopIfAnyPassed || false) :
      null

    switch (retriesConfig.strategy) {
      case 'detect-flake-and-pass-on-threshold':
        if (passedAttemptsCount >= (passesRequired as number)) {
          // we met the threshold, so we can stop retrying and pass the test
          result.outerTestStatus = 'passed'
          result.reasonToStop = 'PASSED_MET_THRESHOLD'
        } else if (remainingAttempts < (neededPassingAttemptsLeft as number)) {
          // we don't have enough remaining attempts to meet the threshold, so we should stop retrying and fail the test
          result.outerTestStatus = 'failed'
          result.forceState = currentAttemptResult === 'passed' ? currentAttemptResult : undefined
          result.reasonToStop = 'FAILED_DID_NOT_MEET_THRESHOLD'
        } else {
          // we haven't met the threshold, but we have enough remaining attempts to meet the threshold, so we should retry the test
          result.final = false
        }

        break
      case 'detect-flake-but-always-fail':
        if (stopIfAnyPassed && passedAttemptsCount > 0) {
          // we have a passing attempt and we should stop retrying and fail the test
          result.outerTestStatus = 'failed'
          result.forceState = currentAttemptResult === 'passed' ? currentAttemptResult : undefined
          result.reasonToStop = 'FAILED_STOPPED_ON_FLAKE'
        } else if (remainingAttempts === 0) {
          // we have no remaining attempts and we should stop retrying and fail the test
          result.outerTestStatus = 'failed'
          result.forceState = currentAttemptResult === 'passed' ? currentAttemptResult : undefined
          result.reasonToStop = 'FAILED_REACHED_MAX_RETRIES'
        } else {
          // we have remaining attempts and we should retry the test
          result.final = false
        }

        break
      default:
        result.outerTestStatus = 'failed'
        result.forceState = currentAttemptResult === 'passed' ? currentAttemptResult : undefined
        result.reasonToStop = 'FAILED_NO_RETRIES'
    }
  } else {
    result.nextInitialStrategy = 'BURN_IN'
    const neededBurnInAttempts = getNeededBurnInAttempts(latestScore, burnInConfig)

    if (neededBurnInAttempts > passedAttemptsCount) {
      result.final = false
    } else {
      result.reasonToStop = neededBurnInAttempts > 0 ? 'PASSED_BURN_IN' : 'PASSED_FIRST_ATTEMPT'
      result.outerTestStatus = 'passed'
    }
  }

  return result
}
