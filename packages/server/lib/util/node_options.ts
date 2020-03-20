import cp from 'child_process'
import debugModule from 'debug'

const debug = debugModule('cypress:server:util:node_options')

const NODE_OPTIONS = `--max-http-header-size=${1024 ** 2} --http-parser=legacy`

/**
 * If Cypress was not launched via CLI, it may be missing certain startup
 * options. This checks that those startup options were applied.
 *
 * @returns {boolean} does Cypress have the expected NODE_OPTIONS?
 */
export function needsOptions (): boolean {
  if ((process.env.NODE_OPTIONS || '').includes(NODE_OPTIONS)) {
    debug('NODE_OPTIONS check passed, not forking %o', { NODE_OPTIONS: process.env.NODE_OPTIONS })

    return false
  }

  if (typeof require.main === 'undefined') {
    debug('require.main is undefined, this should not happen normally, not forking')

    return false
  }

  return true
}

/**
 * Fork the current process using the good NODE_OPTIONS and pipe stdio
 * through the current process. On exit, copy the error code too.
 */
export function forkWithCorrectOptions (): void {
  // this should only happen when running from global mode, when the CLI couldn't set the NODE_OPTIONS
  process.env.ORIGINAL_NODE_OPTIONS = process.env.NODE_OPTIONS || ''
  process.env.NODE_OPTIONS = `${NODE_OPTIONS} ${process.env.ORIGINAL_NODE_OPTIONS}`

  debug('NODE_OPTIONS check failed, forking %o', {
    NODE_OPTIONS: process.env.NODE_OPTIONS,
    ORIGINAL_NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS,
  })

  cp.spawn(
    process.execPath,
    process.argv.slice(1),
    { stdio: 'inherit' },
  )
  .on('error', () => {})
  .on('exit', (code) => {
    process.exit(code)
  })
}

/**
 * Once the Electron process is launched, restore the user's original NODE_OPTIONS
 * environment variables from before the CLI added extra NODE_OPTIONS.
 *
 * This way, any `node` processes launched by Cypress will retain the user's
 * `NODE_OPTIONS` without unexpected modificiations that could cause issues with
 * user code.
 */
export function restoreOriginalOptions (): void {
  // @ts-ignore
  if (!process.versions || !process.versions.electron) {
    debug('not restoring NODE_OPTIONS since not yet in Electron')

    return
  }

  debug('restoring NODE_OPTIONS %o', {
    NODE_OPTIONS: process.env.NODE_OPTIONS,
    ORIGINAL_NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS,
  })

  process.env.NODE_OPTIONS = process.env.ORIGINAL_NODE_OPTIONS || ''
}
