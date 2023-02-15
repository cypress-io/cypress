const runChildProcess = async (entryPoint) => {
  require('./lib/plugins/child/register_ts_node')
  require(entryPoint)
}

const startCypress = async () => {
  try {
    const { telemetry } = require('@packages/telemetry/dist/node')
    const { isRunning } = require('./lib/util/electron-app')

    const { initializeStartTime } = require('./lib/util/performance_benchmark')

    if (isRunning()) {
      telemetry.init({ prefix: 'cypress' })
      telemetry.startSpan('app')
    }

    initializeStartTime()

    // No typescript requires before this point plz
    const { hookRequire } = require('./hook-require')

    hookRequire({ forceTypeScript: false })

    await require('./start-cypress')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

const { entryPoint } = require('minimist')(process.argv.slice(1))

if (entryPoint) {
  module.exports = runChildProcess(entryPoint)
} else {
  module.exports = startCypress()
}
