import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(customParseFormat)
dayjs.extend(utc)

export { dayjs }
