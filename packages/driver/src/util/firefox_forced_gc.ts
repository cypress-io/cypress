import { get, isNumber } from 'lodash'

export function createIntervalGetter (config) {
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
