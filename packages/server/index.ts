import minimist from 'minimist'
import { initializeStartTime } from './lib/util/performance_benchmark'
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

    const { hookRequire } = require('./hook-require')

    hookRequire({ forceTypeScript: false })

    const { run: runCypress } = require('./start-cypress')

    await runCypress()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

const start = async () => {
  const { entryPoint } = minimist(process.argv.slice(1))

  if (entryPoint) {
    await runChildProcess(entryPoint)
  } else {
    await startCypress()
  }
}

// Auto-start when loaded as the package main (scripts/start.js, dev index.js shim, or
// `node packages/server/index.js` for system tests). Matches legacy index.js behavior.
void start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
