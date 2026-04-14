import _ from 'lodash'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'

dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few secs',
    ss: '%d secs',
    m: 'a min',
    mm: '%d mins',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
})

export const format = (durationInMs, padMinutes = true) => {
  const duration = dayjs.duration(durationInMs)

  const durationSecs = duration.seconds() ? `${duration.seconds()}` : ''
  const durationMins = duration.minutes() ? `${duration.minutes()}` : ''
  const durationHrs = duration.hours() ? `${duration.hours()}` : ''

  const total = _.compact([
    durationHrs,
    !!durationHrs || padMinutes ? _.padStart(durationMins, 2, '0') : durationMins,
    _.padStart(durationSecs, 2, '0'),
  ])

  const totalMinSec = total.join(':')

  if (totalMinSec === '00:00') {
    return `${duration.milliseconds()}ms`
  }

  return totalMinSec
}
