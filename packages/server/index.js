const { initializeStartTime } = require('./lib/util/performance_benchmark')

const run = async () => {
  initializeStartTime()

  const { hookRequire } = require('./hook-require')

  hookRequire({ forceTypeScript: false })

  await require('./server-entry')
}

module.exports = run()
