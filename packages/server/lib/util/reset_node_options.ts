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
