import pkg from '@packages/root'
import Bluebird from 'bluebird'

export const configureLongStackTraces = (env: string | undefined) => {
  // never cut off stack traces
  Error.stackTraceLimit = Infinity

  Bluebird.config({
    // uses cancellation for automation timeouts
    cancellation: true,
    // enable long stack traces in dev
    longStackTraces: env === 'development',
  })
}

export const calculateCypressInternalEnv = () => {
  // instead of setting NODE_ENV we will
  // use our own separate CYPRESS_INTERNAL_ENV so
  // as not to conflict with CI providers

  // use env from package first
  // or development as default
  if (!process.env['CYPRESS_INTERNAL_ENV']) {
    // @ts-expect-error
    return pkg.env !== null && pkg.env !== undefined ? pkg.env : 'development'
  }

  return process.env['CYPRESS_INTERNAL_ENV']
}
