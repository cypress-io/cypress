const _ = require('lodash')

const createErrorResult = (errorMessage) => {
  return {
    isValid: false,
    error: new Error(errorMessage),
  }
}

const createSuccessResult = () => {
  return { isValid: true }
}

const validate = (func, arg, errorMessage) => {
  return func(arg) ? createSuccessResult() : createErrorResult(errorMessage)
}

const isFunction = (event, handler) => {
  return validate(_.isFunction, handler, `The handler for the event \`${event}\` must be a function`)
}

const isObject = (event, handler) => {
  return validate(_.isPlainObject, handler, `The handler for the event \`${event}\` must be an object`)
}

const eventValidators = {
  '_get:task:body': isFunction,
  '_get:task:keys': isFunction,
  '_process:cross:origin:callback': isFunction,
  'after:run': isFunction,
  'after:screenshot': isFunction,
  'after:spec': isFunction,
  'before:browser:launch': isFunction,
  'before:run': isFunction,
  'before:spec': isFunction,
  'dev-server:start': isFunction,
  'file:preprocessor': isFunction,
  'task': isObject,
}

const validateEvent = (event, handler, config, errConstructorFn) => {
  const validator = eventValidators[event]

  if (!validator) {
    const userEvents = _.reject(_.keys(eventValidators), (event) => event.startsWith('_'))

    const error = new Error(`invalid event name registered: ${event}`)

    error.name = 'InvalidEventNameError'

    Error.captureStackTrace(error, errConstructorFn)

    return {
      error,
      userEvents,
      isValid: false,
    }
  }

  const result = validator(event, handler, config)

  if (!result.isValid) {
    result.error.name = 'InvalidEventHandlerError'

    Error.captureStackTrace(result.error, errConstructorFn)
  }

  return result
}

module.exports = validateEvent
