import _ from 'lodash'
import { log } from '@packages/errors'
import type { CypressError } from '@packages/errors'
import { GracefulExit } from './graceful-exit'

let reported = false

export const isConfigProcessExit = (err: unknown): err is CypressError => {
  return _.get(err, 'type') === 'CONFIG_PROCESS_EXITED_UNEXPECTEDLY'
}

/**
 * True once the unexpected exit of the config process has been printed. Errors that arrive afterwards
 * (rejected node events, a browser torn down mid-launch) are consequences of it and are not printed again.
 */
export const wasConfigProcessExitReported = () => reported

/**
 * No spec can run without the config process (it hosts the node events and the component testing dev
 * server), so run mode prints the error once and exits.
 */
export const endRunOnConfigProcessExit = (err: CypressError) => {
  if (reported) {
    return
  }

  reported = true

  try {
    // eslint-disable-next-line no-console
    console.log('')
    log(err)
  } finally {
    // the flag is already set, so the exit must be scheduled even if printing fails.
    // exitGracefully catches its own teardown errors and always ends the process.
    void GracefulExit.exitGracefully(1)
  }
}

export const resetConfigProcessExitForTesting = () => {
  reported = false
}
