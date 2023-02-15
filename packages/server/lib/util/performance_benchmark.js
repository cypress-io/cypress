const Debug = require('debug')
const { performance } = require('perf_hooks')
const { telemetry } = require('@packages/telemetry/dist/node')
const { isRunning } = require('./electron-app')

const debug = Debug('cypress:server:performance-benchmark')

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

const initializeStartTime = () => {
  if (!isRunning()) {
    return
  }

  // This needs to be a global since this file is included inside of and outside of the v8 snapshot
  global.cypressServerStartTime = performance.now()
  telemetry.startSpan('server:startup')
}

const debugElapsedTime = (event) => {
  telemetry.getSpan('server:startup')?.end()
  const now = performance.now()
  const delta = now - global.cypressServerStartTime

  debug(`elapsed time at ${event}: ${threeDecimals(delta)}ms`)
}

module.exports = {
  initializeStartTime,
  debugElapsedTime,
}
