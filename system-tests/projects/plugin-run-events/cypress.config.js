/* eslint-disable no-console */
const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')

module.exports = {
  fixturesFolder: false,
  experimentalInteractiveRunEvents: true,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('before:run', (runDetails) => {
        const { specs, browser } = runDetails

        if (config.isTextTerminal) {
          console.log('before:run:', specs[0].relative, browser.name)
        } else {
          const outputPath = path.join(process.cwd(), 'beforeRun.json')

          fs.writeFileSync(outputPath, JSON.stringify(runDetails))
        }

        return Promise.delay(10).then(() => {
          return console.log('before:run is awaited')
        })
      })

      on('after:run', (results) => {
        const { totalTests, totalPassed, totalFailed } = results

        console.log('after:run:', { totalTests, totalPassed, totalFailed })

        return Promise.delay(10).then(() => {
          return console.log('after:run is awaited')
        })
      })

      on('before:spec', (spec) => {
        if (config.isTextTerminal) {
          console.log('before:spec:', spec.relative)
        } else {
          const outputPath = path.join(process.cwd(), 'beforeSpec.json')

          fs.writeFileSync(outputPath, JSON.stringify(spec))
        }

        return Promise.delay(10).then(() => {
          return console.log('before:spec is awaited')
        })
      })

      on('after:spec', (spec, results) => {
        const { stats } = results
        const { tests, passes, failures } = stats

        console.log('spec:end:', spec.relative, { tests, passes, failures })

        return Promise.delay(10).then(() => {
          return console.log('after:spec is awaited')
        })
      })

      return config
    },
  },
}
