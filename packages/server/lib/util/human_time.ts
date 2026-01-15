import dayjs from 'dayjs'
import durationPlugin from 'dayjs/plugin/duration'

dayjs.extend(durationPlugin)

type ParseResult = {
  mins: number
  hours: number
  duration: ReturnType<typeof dayjs.duration>
}

const parse = (ms: number): ParseResult => {
  const duration = dayjs.duration(ms)
  const hours = duration.hours()
  let mins = hours * 60

  return {
    mins,
    hours,
    duration,
  }
}

const long = (ms: number, alwaysIncludeSeconds: boolean = true): string => {
  let { mins, duration } = parse(ms)
  let word: string
  const msg: string[] = []

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

const short = (ms: number, fixed?: number): string => {
  let { mins, duration } = parse(ms)
  const msg: string[] = []

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

export { long, short }

export default {
  long,
  short,
}

// CommonJS compatibility - assign properties individually to avoid conflict with ES6 default export
// Cannot use module.exports = {} because export default creates a read-only 'default' property
module.exports.long = long

module.exports.short = short
