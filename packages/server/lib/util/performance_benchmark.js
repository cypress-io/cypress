const { performance } = require('perf_hooks')
const { isRunning } = require('./electron-app')

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

const initializeStartTime = () => {
  if (!isRunning()) {
    return
  }

  // This needs to be a global since this file is included inside of and outside of the v8 snapshot
  global.cypressBinaryStartTime = performance.timeOrigin
  global.cypressServerStartTime = performance.now()
}

const debugElapsedTime = (event) => {
  const Debug = require('debug')
  const debug = Debug('cypress:server:performance-benchmark')

  const now = performance.now()
  const delta = now - global.cypressServerStartTime

  debug(`elapsed time at ${event}: ${threeDecimals(delta)}ms`)

  return delta
}

module.exports = {
  initializeStartTime,
  debugElapsedTime,
}
