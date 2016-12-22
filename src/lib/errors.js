import _ from 'lodash'

const errors = {
  isAlreadyRequested (err) {
    return _.get(err, 'type') === 'ALREADY_REQUESTED'
  },

  isDenied (err) {
    return _.get(err, 'type') === 'DENIED'
  },

  isMissingProjectId (err) {
    return _.get(err, 'type') === 'NO_PROJECT_ID'
  },

  isNoConnection (err) {
    return _.get(err, 'type') === 'NO_CONNECTION'
  },

  isUnauthenticated (err) {
    return _.get(err, 'type') === 'UNAUTHENTICATED'
  },

  isTimedOut (err) {
    return _.get(err, 'type') === 'TIMED_OUT'
  },

  isUnknown (err) {
    return _.get(err, 'type') === 'UNKNOWN'
  },
}

export default errors
