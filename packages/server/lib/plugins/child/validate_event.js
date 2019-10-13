const _ = require('lodash')

const createErrorResult = (errorMessage) => ({ isValid: false, error: new Error(errorMessage) })
const createSuccessResult = () => ({ isValid: true })

const validate = (func, arg, errorMessage) => {
  return func(arg) ? createSuccessResult() : createErrorResult(errorMessage)
}

const eventHandlerShouldBeAFunction = (event, handler) => {
  validate(_.isFunction, handler, `${event} event handler should be a function`)
}

const eventHandlerShouldBeAnObject = (event, handler) => {
  return validate(_.isPlainObject, handler, `${event} event handler should be an object`)
}

const eventValidators = {
  'file:preprocessor': eventHandlerShouldBeAFunction,
  'before:browser:launch': eventHandlerShouldBeAFunction,
  'task': eventHandlerShouldBeAnObject,
  'after:screenshot': eventHandlerShouldBeAFunction,
  '_get:task:keys': eventHandlerShouldBeAFunction,
  '_get:task:body': eventHandlerShouldBeAFunction,
}

const validateEvent = (event, handler) => {
  const validator = eventValidators[event]

  if (!validator) {
    return createErrorResult(`${event} event is not supported`)
  }

  return validator(event, handler)
}

module.exports = validateEvent
