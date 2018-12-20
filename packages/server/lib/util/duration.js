const _ = require('lodash')
const moment = require('moment')

const format = (durationInMs, padMinutes = true) => {
  const duration = moment.duration(durationInMs)

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
