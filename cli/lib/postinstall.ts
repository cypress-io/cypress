// The package's postinstall script runs this file to download the Cypress binary.
// It is kept out of the package entry so that loading `cypress`, as every config
// file does, never acts on the arguments of the process that loaded it.
import minimist from 'minimist'
import debug from 'debug'
import util from './util'
import installModule from './tasks/install'
import { start as verifyStart } from './tasks/verify'

const debugCli = debug('cypress:cli')

export function runExecTask (argv: string[] = process.argv.slice(2)): Promise<void> {
  const args: any = minimist(argv)

  switch (args.exec) {
    case 'install': {
      debugCli('installing Cypress from NPM')

      return installModule.start({ force: args.force }).catch(util.logErrorExit1)
    }
    case 'verify': {
      // for simple testing in the monorepo
      debugCli('verifying Cypress')

      return verifyStart({ force: true }).catch(util.logErrorExit1) // always force verification
    }
    default: {
      return Promise.resolve()
    }
  }
}

void runExecTask()
