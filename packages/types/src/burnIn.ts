export type AttemptStrategy = 'RETRY' | 'BURN_IN' | 'NONE'

export type ReasonToStop =
| 'PASSED_FIRST_ATTEMPT' // no burn-in needed
| 'PASSED_BURN_IN' // achieved burn-in
| 'PASSED_MET_THRESHOLD' // passed after reaching threshold for strategy 'detect-flake-and-pass-on-threshold'
| 'FAILED_NO_RETRIES' // failed and no retries
| 'FAILED_REACHED_MAX_RETRIES' // failed after reaching max retries
| 'FAILED_DID_NOT_MEET_THRESHOLD' // failed since it's impossible to meet threshold for strategy 'detect-flake-and-pass-on-threshold'
| 'FAILED_STOPPED_ON_FLAKE' // failed with one attempt passing and using strategy 'detect-flake-but-always-fail' with `stopIfAnyPassed` set to true
| 'FAILED_HOOK_FAILED' // failed because a hook failed
