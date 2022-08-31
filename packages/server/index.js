const { initializeStartTime } = require('./lib/util/performance_benchmark')

const run = async () => {
  initializeStartTime()

  const hook = './hook'

  if (require.name !== 'customRequire') {
    require(`${hook}-require`)
  }

  await require('./server-entry')
}

module.exports = run()
