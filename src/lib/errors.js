import _ from 'lodash'

const errors = {
  isMissingProjectId (err) {
    return _.get(err, "type") === 'NO_PROJECT_ID'
  },

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
