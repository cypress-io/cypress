const { initializeStartTime } = require('./lib/util/performance_benchmark')

const run = async () => {
  initializeStartTime()

  if (require.name !== 'customRequire') {
    // Purposefully make this a dynamic require so that it doesn't have the potential to get picked up by snapshotting mechanism
    const hook = './hook'

    require(`${hook}-require`)
  }

  await require('./server-entry')
}

module.exports = run()
