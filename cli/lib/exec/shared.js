const { errors } = require('../errors')

/**
 * Throws an error with "details" property from
 * "errors" object.
 * @param {Object} details - Error details
 */
const throwInvalidOptionError = (details) => {
  if (!details) {
    details = errors.unknownError
  }

  // throw this error synchronously, it will be caught later on and
  // the details will be propagated to the promise chain
  const err = new Error()

  err.details = details
  throw err
}

/**
 * Adds configured `testingType` to the exec args
 * @param {string} testingType The type of tests being executed
 * @param {string[]} args The mutable array of exec arguments
 */
const processTestingType = (testingType, args) => {
  if (testingType) {
    if (testingType === 'e2e') {
      args.push('--testing-type', 'e2e')
    } else if (testingType === 'component') {
      args.push('--testing-type', 'component')
    } else {
      return throwInvalidOptionError(errors.invalidTestingType)
    }
  }
}

module.exports = {
  throwInvalidOptionError,
  processTestingType,
}
