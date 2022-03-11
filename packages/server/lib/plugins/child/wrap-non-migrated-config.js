const debugLib = require('debug')

const debug = debugLib(`cypress:lifecycle:child:RunPlugins:${process.pid}`)
const { breakingOptions } = require('@packages/config')

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
