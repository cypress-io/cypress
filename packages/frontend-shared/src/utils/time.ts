import enTimeAgo from 'javascript-time-ago/locale/en'
import TimeAgo from 'javascript-time-ago'

TimeAgo.addDefaultLocale(enTimeAgo)
const timeAgo = new TimeAgo('en-US')

export function getTimeAgo (iso8601: string) {
  return timeAgo.format(new Date(iso8601))
}
