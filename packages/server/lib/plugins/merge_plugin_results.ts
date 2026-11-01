import _ from 'lodash'

// Shared by the server and the plugins child process, so handlers chained in
// the child see the same values the server applies. Keep its imports to
// lodash: the child runs under the user's Node, which can be older than the
// Node that server modules are written for.

// Object options such as `env` are extended so a handler can add one key
// without restating the rest, and an empty value keeps the current option
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
