import { computed, Ref, unref } from 'vue'
import { dayjs } from '../runs/utils/day.js'

/*
  Format duration to in HH:mm:ss format. The `totalDuration` field is milliseconds. Remove the leading "00:" if the value is less
  than an hour. Currently, there is no expectation that a run duration will be greater 24 hours or greater, so it is okay that
  this format would "roll-over" in that scenario.
  Ex: 1 second which is 1000ms = 00:01
  Ex: 1 hour and 1 second which is 3601000ms = 01:00:01
*/
export function useDurationFormat (value: number | Ref<number>) {
  return computed(() => {
    const duration = unref(value)

    if (duration >= 1000) {
      return dayjs.duration(duration).format('HH:mm:ss').replace(/^0+:/, '')
    }

    return `${duration }ms`
  })
}
