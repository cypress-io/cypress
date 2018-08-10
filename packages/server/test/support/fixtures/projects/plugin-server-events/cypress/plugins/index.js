/* eslint-disable no-console */

module.exports = (on) => {
  on('before:spec', (spec) => {
    console.log('before:spec:', spec.relative)
  })

  on('after:spec', (spec, results) => {
    const { stats } = results
    const { tests, passes, failures } = stats
    console.log('after:spec:', spec.relative, { tests, passes, failures })
  })

  on('after:run', (results) => {
    const { totalTests, totalPassed, totalFailed } = results
    console.log('after:run:', { totalTests, totalPassed, totalFailed })
  })
}
