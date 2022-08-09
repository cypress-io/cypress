const getTime = require('performance-now')
const Debug = require('debug')

const debug = Debug('cypress:server:performance-benchmark')

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

const initializeStartTime = () => {
  global.startTime = getTime()
}

const debugElapsedTime = (event) => {
  const now = getTime()
  const delta = now - global.startTime

  debug(`elapsed time at ${event}: ${threeDecimals(delta)}`)
}

module.exports = {
  initializeStartTime,
  debugElapsedTime,
}
