import { dayjs } from '../../runs/utils/day.js'

/**
 *  Format duration to in HH[h] mm[m] ss[s] format. The `totalDuration` field is milliseconds. Remove the leading "00h" if the value is less
 *  than an hour. Currently, there is no expectation that a run duration will be greater 24 hours or greater, so it is okay that
 *  this format would "roll-over" in that scenario.
 *  Ex: 1 second which is 1000ms = 00m 01s
 *  Ex: 1 hour and 1 second which is 3601000ms = 01h 00m 01s
 */
export const formatDuration = (duration: number) => {
  return dayjs.duration(duration).format('HH[h] mm[m] ss[s]').replace(/^0+h /, '')
}

export const formatCreatedAt = (createdAt: string) => {
  return dayjs(new Date(createdAt)).fromNow()
}
