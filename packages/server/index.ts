import minimist from 'minimist'
import { initializeStartTime } from './lib/util/performance_benchmark'
import { runWithSnapshot } from './hook-require'
import { calculateCypressInternalEnv, configureLongStackTraces } from './lib/environment'

const runChildProcess = async (entryPoint: string) => {
  require(entryPoint)
}

const startCypress = async () => {
  try {
    initializeStartTime()

    // NOTE: CYPRESS_INTERNAL_ENV MUST BE SET BEFORE LOADING start-cypress
    process.env['CYPRESS_INTERNAL_ENV'] = calculateCypressInternalEnv()
    configureLongStackTraces(process.env['CYPRESS_INTERNAL_ENV'])
    process.env['CYPRESS'] = 'true'

    // @ts-expect-error - getSnapshotResult is global
    if (!['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE) && typeof getSnapshotResult !== 'undefined') {
      runWithSnapshot(false)
    }

    const { run: runCypress } = require('./start-cypress')

    await runCypress()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

export const start = async () => {
  const { entryPoint } = minimist(process.argv.slice(1))

  if (entryPoint) {
    await runChildProcess(entryPoint)
  } else {
    await startCypress()
  }
}

// When bundled as the binary entry point, Electron loads this file directly.
// In dev, index.js registers tsx and calls start() explicitly instead.
if (require.main === module) {
  void start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
}
