const moment = require('moment')
const pluralize = require('pluralize')

const parse = function (ms) {
  let mins = 0

  const duration = moment.duration(ms)

  const hours = duration.hours()

  mins = hours * 60

  return {
    mins,
    hours,
    duration,
  }
}

const long = function (ms, alwaysIncludeSeconds = true) {
  let word
  const msg = []

  let { mins, duration } = parse(ms)

  mins += duration.minutes()

  if (mins) {
    word = pluralize('minute', mins)
    msg.push(`${mins} ${word}`)
  }

  const secs = duration.seconds()

  if (alwaysIncludeSeconds || (secs > 0)) {
    word = pluralize('second', secs)
    msg.push(`${secs} ${word}`)
  }

  return msg.join(', ')
}

const short = function (ms) {
  const msg = []

  let { mins, duration } = parse(ms)

  mins += duration.minutes()

  if (mins) {
    msg.push(`${mins}m`)
  }

  const secs = duration.seconds()

  if (secs) {
    msg.push(`${secs}s`)
  } else {
    if (!mins) {
      const millis = duration.milliseconds()

      if (millis) {
        msg.push(`${millis}ms`)
      } else {
        msg.push(`${secs}s`)
      }
    }
  }

  return msg.join(', ')
}

module.exports = {
  long,

  short,
}
