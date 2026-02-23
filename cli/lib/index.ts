import minimist from 'minimist'
import debug from 'debug'
import util from './util'
import installModule from './tasks/install'
import { start as verifyStart } from './tasks/verify'
import * as cypress from './cypress'
const debugCli = debug('cypress:cli')
const args: any = minimist(process.argv.slice(2))

// we're being used from the command line
async function handleExec (): Promise<void> {
  switch (args.exec) {
    case 'install': {
      debugCli('installing Cypress from NPM')

      installModule.start({ force: args.force })
      .catch(util.logErrorExit1)

      break
    }
    case 'verify': {
      // for simple testing in the monorepo
      debugCli('verifying Cypress')

      verifyStart({ force: true }) // always force verification
      .catch(util.logErrorExit1)

      break
    }
    default: {
      break
    }
  }
}

// Execute the async function
if (args.exec) {
  handleExec().catch(util.logErrorExit1)
} else {
  debugCli('exporting Cypress module interface')
}

// this is how the module needs to be exported to avoid a breaking change
// default exports WILL BREAK in a CJS context through a require('cypress') call

export const open = cypress.open

export const run = cypress.run

export const cli = cypress.cli

export const defineConfig = cypress.defineConfig

export const defineComponentFramework = cypress.defineComponentFramework

export default cypress
