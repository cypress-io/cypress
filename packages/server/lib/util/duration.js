const _ = require('lodash')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const relativeTime = require('dayjs/plugin/relativeTime')
const updateLocale = require('dayjs/plugin/updateLocale')

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

const format = (durationInMs, padMinutes = true) => {
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

module.exports = {
  format,
}
