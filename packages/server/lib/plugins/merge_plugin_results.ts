import _ from 'lodash'

// Shared by the server and the plugins child process, so handlers chained in
// the child see the same values the server applies. Keep this lodash-only:
// the child runs under the user's Node and should not load server modules.

export const mergeLaunchOptions = (launchOptions: Record<string, any>, result: Record<string, any>) => {
  const merged = { ...launchOptions }

  _.forEach(result, (value, key) => {
    if (!value) {
      return
    }

    merged[key] = _.isPlainObject(launchOptions[key]) ? { ...launchOptions[key], ...value } : value
  })

  return merged
}

export const mergeScreenshotDetails = <T extends Record<string, any>>(details: T, updates: unknown): T | undefined => {
  if (!_.isPlainObject(updates)) {
    return undefined
  }

  return { ...details, ..._.pick(updates, 'size', 'dimensions', 'path') }
}
