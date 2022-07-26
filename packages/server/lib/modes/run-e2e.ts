import type { LaunchArgs } from '@packages/types'

export const run = (options: LaunchArgs, loading: Promise<void>) => {
  return require('./run').run(options, loading)
}
