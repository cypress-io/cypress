import _ from 'lodash'

const errors = {
  isUnauthenticated (err) {
    return _.get(err, "type") === 'UNAUTHENTICATED'
  },

  isUnknown (err) {
    return _.get(err, "type") === 'UNKNOWN'
  },

  isTimedOut (err) {
    return _.get(err, "type") === 'TIMED_OUT'
  },
}

export default errors
