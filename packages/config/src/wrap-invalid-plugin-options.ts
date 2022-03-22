import debugLib from 'debug'
import { breakingOptions, breakingRootOptions } from './options'

const debug = debugLib(`cypress:config:child:wrap-plugin-errors:${process.pid}`)

/**
 * Throw the error with the proper codeFrame
 */
function throwInvalidOptionError (errorKey: string, name: string) {
  debug('throwing err %s', name)
  const errInternal = new Error()

  Error.captureStackTrace(errInternal, throwInvalidOptionError)
  const err = require('@packages/errors').getError(errorKey, { name, setupNodeEvents: true }, errInternal)

  throw err
}

// only works if config.myProperty = 'something'
// this will not throw config = {...config, myProperty: 'something'}
function setInvalidPropSetterWarning (opts: Record<string, any>, errorKey: string, optionName: string, optionNameForError = optionName) {
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
export function wrapInvalidPluginOptions (options: Record<string, any>) {
  debug('wrapping non-migrated options')
  breakingOptions.filter(({ isWarning }) => !isWarning).forEach(({ name, errorKey }) => {
    setInvalidPropSetterWarning(options, errorKey, name)

    const testingTypes = ['component', 'e2e']

    testingTypes.forEach((testingType) => {
      options[testingType] = options[testingType] || {}
      setInvalidPropSetterWarning(options[testingType], errorKey, name, `${testingType}.${name}`)
    })
  })

  breakingRootOptions.filter(({ isWarning }) => !isWarning).forEach(({ name, errorKey }) => {
    setInvalidPropSetterWarning(options, errorKey, name)
  })
}
