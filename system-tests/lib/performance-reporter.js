const path = require('path')
const chalk = require('chalk')
const mochaReporters = require('mocha-7.0.1/lib/reporters')
const StatsD = require('hot-shots')

class StatsdReporter extends mochaReporters.Spec {
  constructor (runner) {
    super(runner)
    const statsD = new StatsD({})
    let startTime; let testTime

    runner.on('start', () => {
      console.log(chalk.bold.green('  Reporting performance to statsd'))
      startTime = Date.now()
    })

    runner.on('test', () => {
      testTime = Date.now()
    })

    runner.on('test end', (test) => {
      const specName = path.basename(runner.suite.file).replace(/\W/g, '_')
      const testTitle = test.title.replace(/\W/g, '_')
      const statsdPath = `performance.${specName}.${testTitle}`

      statsD.timing(`${statsdPath }.hooks`, test.timings.lifecycle)
      statsD.timing(`${statsdPath }.test`, test.timings.test.fnDuration)
      statsD.timing(`${statsdPath }.total`, Date.now() - testTime)
    })

    runner.on('end', (spec) => {
      const specName = path.basename(runner.suite.file).replace(/\W/g, '_')
      const statsdPath = `performance.${specName}`

      statsD.timing(`${statsdPath }.mocha`, runner.stats.wallClockEndedAt - runner.stats.wallClockStartedAt)
      statsD.timing(`${statsdPath }.total`, Date.now() - startTime)
    })
  }
}

module.exports = StatsdReporter
