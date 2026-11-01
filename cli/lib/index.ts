import * as cypress from './module-api'

// Running this file directly with `--exec install|verify` runs the postinstall
// tasks, for scripts that call it by path. Requiring it never does, because the
// process that requires it, such as a tool loading a config file, may have been
// started with an `--exec` flag of its own.
if (typeof module !== 'undefined' && require.main === module) {
  void import('./postinstall')
}

// this is how the module needs to be exported to avoid a breaking change
// default exports WILL BREAK in a CJS context through a require('cypress') call

export const open = cypress.open

export const run = cypress.run

export const cli = cypress.cli

export const defineConfig = cypress.defineConfig

export const defineComponentFramework = cypress.defineComponentFramework

export default cypress
