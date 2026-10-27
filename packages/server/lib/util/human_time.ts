import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const parse = (ms) => {
  const duration = dayjs.duration(ms)
  const hours = duration.hours()
  const mins = hours * 60

  return {
    mins,
    hours,
    duration,
  }
}

export const long = (ms, alwaysIncludeSeconds = true) => {
  const { mins: hourMins, duration } = parse(ms)
  const mins = hourMins + duration.minutes()
  let word
  const msg: string[] = []

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

export const short = (ms, fixed: number | undefined = undefined) => {
  const { mins: hourMins, duration } = parse(ms)
  const mins = hourMins + duration.minutes()
  const msg: string[] = []

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
