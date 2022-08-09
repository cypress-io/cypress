const getTime = require('performance-now')
const Debug = require('debug')

const debug = Debug('cypress:server:performance-benchmark')

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

let startTime

const initializeStartTime = () => {
  startTime = getTime()
}

const debugElapsedTime = (event) => {
  const now = getTime()
  const delta = now - startTime

  debug(`elapsed time at ${event}: ${threeDecimals(delta)}`)
}

module.exports = {
  initializeStartTime,
  debugElapsedTime,
}
