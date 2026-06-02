import { performance } from 'perf_hooks'
import { isRunning } from './electron-app'

function threeDecimals (n: number): number {
  return Math.round(n * 1000) / 1000
}

declare global {
  var cypressBinaryStartTime: number | undefined
  var cypressServerStartTime: number | undefined
}

export const initializeStartTime = (): void => {
  if (!isRunning()) {
    return
  }

  // This needs to be a global since this file is included inside of and outside of the v8 snapshot
  global.cypressBinaryStartTime = performance.timeOrigin
  global.cypressServerStartTime = performance.now()
}

export const debugElapsedTime = (event: string): number => {
  const Debug = require('debug')
  const debug = Debug('cypress:server:performance-benchmark')

  const now = performance.now()
  const serverStart = global.cypressServerStartTime
  // Match legacy JS when uninitialized: `now - undefined` is `NaN`.
  const delta = serverStart === undefined ? NaN : now - serverStart

  debug(`elapsed time at ${event}: ${threeDecimals(delta)}ms`)

  return delta
}
