const runChildProcess = async (entryPoint) => {
  require('./lib/plugins/child/register_ts_node')
  require(entryPoint)
}

const runMainProcess = async () => {
  const { initializeStartTime } = require('./lib/util/performance_benchmark')

  initializeStartTime()

  if (require.name !== 'customRequire') {
    // Purposefully make this a dynamic require so that it doesn't have the potential to get picked up by snapshotting mechanism
    const hook = './hook'

    const { hookRequire } = require(`${hook}-require`)

    hookRequire({ forceTypeScript: false })
  }

  await require('./server-entry')
}

const { entryPoint } = require('minimist')(process.argv.slice(1))

if (entryPoint) {
  module.exports = runChildProcess(entryPoint)
} else {
  module.exports = runMainProcess()
}
