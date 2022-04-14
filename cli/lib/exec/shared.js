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
 * Selects exec args based on the configured `testingType`
 * @param {string} testingType The type of tests being executed
 * @returns {string[]} The array of new exec arguments
 */
const processTestingType = (options) => {
  if (options.e2e && options.component) {
    return throwInvalidOptionError(errors.incompatibleTestTypeFlags)
  }

  if (options.testingType && (options.component || options.e2e)) {
    return throwInvalidOptionError(errors.incompatibleTestTypeFlags)
  }

  if (options.testingType === 'component' || options.component || options.ct) {
    return ['--testing-type', 'component']
  }

  if (options.testingType === 'e2e' || options.e2e) {
    return ['--testing-type', 'e2e']
  }

  if (options.testingType) {
    return throwInvalidOptionError(errors.invalidTestingType)
  }

  return []
}

/**
 * Throws an error if configFile is string 'false' or boolean false
 * @param {*} options
 */
const checkConfigFile = (options) => {
  // CLI will parse as string, module API can pass in boolean
  if (options.configFile === 'false' || options.configFile === false) {
    throwInvalidOptionError(errors.invalidConfigFile)
  }
}

module.exports = {
  throwInvalidOptionError,
  processTestingType,
  checkConfigFile,
}
