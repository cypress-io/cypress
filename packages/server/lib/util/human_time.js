const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')

dayjs.extend(duration)

const parse = (ms) => {
  const duration = dayjs.duration(ms)
  const hours = duration.hours()
  let mins = hours * 60

  return {
    mins,
    hours,
    duration,
  }
}

const long = (ms, alwaysIncludeSeconds = true) => {
  let { mins, duration } = parse(ms)
  let word
  const msg = []

  mins += duration.minutes()

  if (mins) {
    word = mins === 1 ? 'minute' : 'minutes'
    msg.push(`${mins} ${word}`)
  }

  const secs = duration.seconds()

  if (alwaysIncludeSeconds || (secs > 0)) {
    word = secs === 1 ? 'second' : 'seconds'
    msg.push(`${secs} ${word}`)
  }

  return msg.join(', ')
}

const short = (ms, fixed = undefined) => {
  let { mins, duration } = parse(ms)
  const msg = []

  mins += duration.minutes()

  if (mins) {
    msg.push(`${mins}m`)
  }

  const secs = duration.seconds()

  if (secs) {
    msg.push(`${secs}s`)
  } else {
    if (!mins) {
      const millis = fixed ? duration.milliseconds().toFixed(fixed) : duration.milliseconds()

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
