const { initializeStartTime } = require('./lib/util/performance_benchmark')

const startCypress = async () => {
  try {
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

module.exports = startCypress()
