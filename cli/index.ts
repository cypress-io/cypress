import minimist from 'minimist'
import debug from 'debug'
import util from './lib/util'
import CLI from './lib/cypress'
import installModule from './lib/tasks/install'
import verifyModule from './lib/tasks/verify'

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

      verifyModule.start({ force: true }) // always force verification
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
export = CLI
