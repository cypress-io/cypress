import _ from 'lodash'

const errors = {
  isAlreadyMember (err) {
    return _.get(err, 'type') === 'ALREADY_MEMBER'
  },

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

  isNotFound (err) {
    return _.get(err, 'type') === 'NOT_FOUND'
  },

  isUnauthenticated (err) {
    return (
      _.get(err, 'type') === 'UNAUTHENTICATED'
      || _.get(err, 'statusCode') === 401
    )
  },

  isUnauthorized (err) {
    return _.get(err, 'statusCode') === 403
  },

  isTimedOut (err) {
    return _.get(err, 'type') === 'TIMED_OUT'
  },

  isUnknown (err) {
    return _.get(err, 'type') === 'UNKNOWN'
  },
}

export default errors
