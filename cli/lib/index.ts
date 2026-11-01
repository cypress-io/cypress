import minimist from 'minimist'
import * as cypress from './module-api'

const args: any = minimist(process.argv.slice(2))

// we're being used from the command line, such as by the postinstall script.
// The tasks are loaded lazily so that require('cypress') stays cheap.
function handleExec (): Promise<void> {
  switch (args.exec) {
    case 'install': {
      return import('./tasks/install').then(({ default: installModule }) => installModule.start({ force: args.force }))
    }
    case 'verify': {
      // for simple testing in the monorepo
      return import('./tasks/verify').then(({ start }) => start({ force: true })) // always force verification
    }
    default: {
      return Promise.resolve()
    }
  }
}

if (args.exec) {
  import('./util').then(({ default: util }) => handleExec().catch(util.logErrorExit1))
}

// this is how the module needs to be exported to avoid a breaking change
// default exports WILL BREAK in a CJS context through a require('cypress') call

export const open = cypress.open

export const run = cypress.run

export const cli = cypress.cli

export const defineConfig = cypress.defineConfig

export const defineComponentFramework = cypress.defineComponentFramework

export default cypress
