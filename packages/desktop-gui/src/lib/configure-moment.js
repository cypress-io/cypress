import moment from 'moment'

const configureMoment = () => {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a few secs',
      ss: '%d secs',
      m: 'a min',
      mm: '%d mins',
      h: 'an hour',
      hh: '%d hours',
      d: 'a day',
      dd: '%d days',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years',
    },
  })
}

export default configureMoment
