import { get, isNumber } from 'lodash'

export function create (config) {
  return () => {
    if (get(config('browser'), 'family') !== 'firefox') {
      return undefined
    }

    const intervals = config('firefoxGcInterval')

    if (isNumber(intervals)) {
      return intervals
    }

    return intervals[config('isInteractive') ? 'openMode' : 'runMode']
  }
}
