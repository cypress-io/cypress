const { initializeStartTime } = require('./lib/util/performance_benchmark')

const run = async () => {
  initializeStartTime()
  await require('./server-entry')
}

module.exports = run()
