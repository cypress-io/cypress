// runs Cypress with "normal" CLI parameters
// but after the run verifies the expected number of passing tests
const cypress = require('cypress')
const debug = require('debug')('cypress-expect')
const arg = require('arg')

const args = arg({
  '--passing': Number, // number of total passing tests to expect
})
if (typeof args['--passing'] !== 'number') {
  console.error('expected a number of --passing tests', args['--passing'])
  process.exit(1)
}
if (typeof args['--passing'] < 0) {
  console.error('expected a number of --passing tests', args['--passing'])
  process.exit(1)
}

const parseArguments = async () => {
  // remove all our arguments to let Cypress only deal with its arguments
  const cliArgs = args._
  if (cliArgs[0] !== 'cypress') {
    cliArgs.unshift('cypress')
  }

  debug('parsing Cypress CLI %o', cliArgs)
  return await cypress.cli.parseRunArguments(cliArgs)
}

parseArguments()
  .then(options => {
    debug('parsed CLI options %o', options)

    return cypress.run(options)
  })
  .then(runResults => {
    // see https://on.cypress.io/module-api
    if (runResults.failures) {
      console.error(runResults.message)
      process.exit(1)
    }

    if (runResults.totalFailed) {
      console.error('%d test(s) failed', runResults.totalFailed)
      process.exit(runResults.totalFailed)
    }

    // make sure the expected number of tests executed
    if (runResults.totalPassed !== args['--passing']) {
      console.error(
        'expected %d passing tests, got %d',
        args['--passing'],
        runResults.totalPassed,
      )
      process.exit(1)
    }
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
