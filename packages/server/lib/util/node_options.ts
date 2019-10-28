import cp from 'child_process'
import debugModule from 'debug'

const debug = debugModule('cypress:server:util:node_options')

/**
 * If Cypress was not launched via CLI, it may be missing certain startup
 * options. This checks that those startup options were applied; and if not,
 * applies them, forks, and pipes stdio.
 *
 * @returns {boolean} was a fork created?
 */
export function maybeFork (): boolean {
  if ((process.env.NODE_OPTIONS || '').includes(`--max-http-header-size=${1024 ** 2}`)) {
    debug('NODE_OPTIONS check passed, not forking %o', { NODE_OPTIONS: process.env.NODE_OPTIONS })

    return false
  }

  if (typeof require.main === 'undefined') {
    debug('require.main is undefined, this should not happen normally, not forking')

    return false
  }

  // this should only happen when running from global mode, when the CLI couldn't set the NODE_OPTIONS
  const NODE_OPTIONS = `--max-http-header-size=${1024 * 1024}`

  process.env.ORIGINAL_NODE_OPTIONS = process.env.NODE_OPTIONS || ''
  process.env.NODE_OPTIONS = `${NODE_OPTIONS} ${process.env.ORIGINAL_NODE_OPTIONS}`

  debug('NODE_OPTIONS check failed, forking %o', {
    NODE_OPTIONS: process.env.NODE_OPTIONS,
    ORIGINAL_NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS,
  })

  cp.fork(
    require.main.filename,
    process.argv.slice(1),
    // @ts-ignore
    {
      // This is actually the correct way to do it, despite TS - ['inherit', 'inherit', 'inherit'] won't work with cp.fork
      // @see https://github.com/nodejs/node/blob/2f45ad8060e13d5ac912335096d21526f2f9602b/lib/child_process.js#L106-L115
      stdio: 'inherit',
    }
  )
  .on('error', () => {})
  .on('exit', (code) => {
    process.exit(code)
  })

  return true
}

/**
 * Once the Electron process is launched, restore the user's original NODE_OPTIONS
 * environment variables from before the CLI added extra NODE_OPTIONS.
 *
 * This way, any `node` processes launched by Cypress will retain the user's
 * `NODE_OPTIONS` without unexpected modificiations that could cause issues with
 * user code.
 */
export function reset (): void {
  // @ts-ignore
  if (!process.versions.electron) {
    debug('not restoring NODE_OPTIONS since not yet in Electron')

    return
  }

  debug('restoring NODE_OPTIONS %o', {
    NODE_OPTIONS: process.env.NODE_OPTIONS,
    ORIGINAL_NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS,
  })

  process.env.NODE_OPTIONS = process.env.ORIGINAL_NODE_OPTIONS || ''
}
