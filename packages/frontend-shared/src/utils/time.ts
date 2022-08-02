import enTimeAgo from 'javascript-time-ago/locale/en'
import TimeAgo from 'javascript-time-ago'

TimeAgo.addDefaultLocale(enTimeAgo)
const timeAgo = new TimeAgo('en-US')

export function getTimeAgo (iso8601: string) {
  return timeAgo.format(new Date(iso8601))
}

export function getDurationString (totalSeconds: number): string {
  const roundedTotalSeconds = Math.floor(totalSeconds / 1000)
  const seconds = roundedTotalSeconds % 60
  const roundedTotalMinutes = Math.floor(roundedTotalSeconds / 60)
  const minutes = roundedTotalMinutes % 60
  const roundedTotalHours = Math.floor(roundedTotalMinutes / 60)
  const hours = roundedTotalHours % 60

  if (hours) {
    return `${hours}:${
    minutes.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
    }:${
    seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
    }`
  }

  return `${
    minutes
    }:${
    seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
    }`
}
