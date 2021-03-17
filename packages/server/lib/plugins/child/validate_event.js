const _ = require('lodash')

const createErrorResult = (errorMessage) => ({ isValid: false, error: new Error(errorMessage) })
const createSuccessResult = () => ({ isValid: true })

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

const validateEvent = (event, handler, config) => {
  const validator = eventValidators[event]

  if (!validator) {
    const userEvents = _.reject(_.keys(eventValidators), (event) => event.startsWith('_'))

    return createErrorResult(`You must pass a valid event name when registering a plugin.

You passed: \`${event}\`

The following are valid events:
- ${userEvents.join('\n- ')}
`)
  }

  return validator(event, handler, config)
}

module.exports = validateEvent
