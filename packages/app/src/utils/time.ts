import enTimeAgo from 'javascript-time-ago/locale/en'
import TimeAgo from 'javascript-time-ago'

TimeAgo.addDefaultLocale(enTimeAgo)
const timeAgo = new TimeAgo('en-US')

export function getTimeAgo (value) {
  return timeAgo.format(value)
}
