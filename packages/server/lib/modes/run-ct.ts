import type { LaunchArgs } from '@packages/types'

export const run = (options: LaunchArgs, loadingPromise: Promise<void>) => {
  // TODO: make sure if we need to run this in electron by default to match e2e behavior?
  options.browser = options.browser || 'electron'
  options.runAllSpecsInSameBrowserSession = true

  return require('./run').run(options, loadingPromise)
}
