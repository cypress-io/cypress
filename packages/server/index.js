const runChildProcess = async (entryPoint) => {
  require('./lib/plugins/child/register_ts_node')
  require(entryPoint)
}

const startCypress = async () => {
  try {
    const { initializeStartTime } = require('./lib/util/performance_benchmark')

    initializeStartTime()

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
