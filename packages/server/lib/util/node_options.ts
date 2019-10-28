import cp from 'child_process'
import debugModule from 'debug'

const debug = debugModule('cypress:server:util:node_options')

export function maybeFork () {
  if ((process.env.NODE_OPTIONS || '').includes(`--max-http-header-size=${1024 ** 2}`)) {
    debug('NODE_OPTIONS check passed, not forking %o', { NODE_OPTIONS: process.env.NODE_OPTIONS })

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

  cp.fork(require.main.filename, process.argv.slice(1), {
    stdio: 'inherit',
  })
  .on('error', () => {})

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
export function reset () {
  // @ts-ignore
  if (process.versions.electron && typeof process.env.ORIGINAL_NODE_OPTIONS === 'string') {
    process.env.NODE_OPTIONS = process.env.ORIGINAL_NODE_OPTIONS

    delete process.env.ORIGINAL_NODE_OPTIONS
  }
}
