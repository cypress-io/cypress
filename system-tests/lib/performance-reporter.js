const path = require('path')
const chalk = require('chalk')
const mochaReporters = require('mocha-7.0.1/lib/reporters')
const StatsD = require('hot-shots')

class StatsdReporter extends mochaReporters.Spec {
  constructor (runner) {
    super(runner)

    if (process.env.CYPRESS_STATSD_TIMINGS) {
      const statsD = new StatsD({})
      let testTime

      runner.on('start', () => {
        console.log(chalk.bold.green('  Reporting performance to statsd'))
      })

      runner.on('test', () => {
        testTime = Date.now()
      })

      runner.on('test end', (test) => {
        const specName = path.basename(runner.suite.file).replace(/\W/g, '_')
        const testTitle = test.title.replace(/\W/g, '_')
        const statsdPath = `cy_system_tests.${'branch'}.${specName}.${testTitle}`

        statsD.timing(`${statsdPath}`, Date.now() - testTime)
      })
    }
  }
}

module.exports = StatsdReporter
