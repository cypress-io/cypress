const { initializeStartTime } = require('./lib/util/performance_benchmark')

const run = async () => {
  try {
    initializeStartTime()

    const { hookRequire } = require('./hook-require')

    hookRequire({ forceTypeScript: false })

    await require('./server-entry')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

module.exports = run()
