const Debug = require('debug')
const { performance } = require('perf_hooks')

const debug = Debug('cypress:server:performance-benchmark')

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

const initializeStartTime = () => {
  // This needs to be a global since this file is included inside of and outside of the v8 snapshot
  global.cypressServerStartTime = performance.now()
}

const debugElapsedTime = (event) => {
  const now = performance.now()
  const delta = now - global.cypressServerStartTime

  debug(`elapsed time at ${event}: ${threeDecimals(delta)}ms`)
}

module.exports = {
  initializeStartTime,
  debugElapsedTime,
}
