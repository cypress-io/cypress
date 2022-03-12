const debugLib = require('debug')

const debug = debugLib(`cypress:lifecycle:child:WrapNonMigrated:${process.pid}`)
const { breakingOptions } = require('@packages/config')

/**
 * Throw the error with the proper codeFrame
 * @param {string} errorKey
 * @param {string} name
 */
function throwInvalidOptionError (errorKey, name) {
  debug('throwing err %s', name)
  const errInternal = new Error()

  Error.captureStackTrace(errInternal, throwInvalidOptionError)
  const err = require('@packages/errors').getError(errorKey, { name }, errInternal)

  throw err
}

// only works if config.myProperty = 'something'
// this will not throw config = {...config, myProperty: 'something'}
function setInvalidPropSetterWarning (opts, errorKey, optionName, optionNameForError = optionName) {
  debug('setting invalid property %s', optionName)
  Object.defineProperty(opts, optionName, {
    set: throwInvalidOptionError.bind(null, errorKey, optionNameForError),
  })
}

/**
 * When using setupNodeEvents, setting some config values is invalid.
 * We validate this after running the function.
 * The config that the function returns is checked for those invalid values.
 * But this after-the-fact error only tells them: "you can't do that"
 *
 * The wrapNonMigratedOptions function wraps the config object and throws
 * an error at the line the user tries to set a value that is not allowed.
 * This way, the user can simply click on the codeFrame that the error
 * has generated. Cypress opens the file and they can fix the problem.
 * @param {Cypress.Config} options the config object passed to setupNodeEvents
 */
module.exports = function wrapNonMigratedOptions (options) {
  debug('wrapping non-migrated options')
  breakingOptions.filter(({ isWarning }) => !isWarning).forEach(({ name, errorKey }) => {
    setInvalidPropSetterWarning(options, errorKey, name)

    const testingTypes = ['component', 'e2e']

    testingTypes.forEach((testingType) => {
      options[testingType] = options[testingType] || {}
      setInvalidPropSetterWarning(options[testingType], errorKey, name, `${testingType}.${name}`)
    })
  })
}
