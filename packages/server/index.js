const run = async (profiler) => {
  const cpuUsage = require('./util/cpuUsage').initCpuUsage()
  const bench = require('./util/bench').initBenchmark('startup')

  bench.time('start')
  await profiler.start()

  if (process.env.TIME_REQUIRE_IND != null) {
    require('time-require')
  }

  const srv = require('./server-entry')

  await srv.server.cypressServer()

  cpuUsage.stop()
  // eslint-disable-next-line no-console
  await profiler.stop()

  bench.timeEnd('start')
  bench.dumpAverages()
  bench.save()

  process.exit(0)
}

const profiler = require('./util/profiler').initProfiler('startup')

module.exports = run(profiler)
