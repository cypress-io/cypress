const _ = require('lodash')

const createErrorResult = (errorMessage) => ({ isValid: false, error: new Error(errorMessage) })
const createSuccessResult = () => ({ isValid: true })

const validate = (func, arg, errorMessage) => {
  return func(arg) ? createSuccessResult() : createErrorResult(errorMessage)
}

const isFunction = (event, handler) => {
  return validate(_.isFunction, handler, `The handler for the event \`${event}\` must be a function`)
}

const isValidRunEvent = (event, handler, config) => {
  if (!config.experimentalRunEvents) {
    return createErrorResult(`The \`${event}\` event requires the experimentalRunEvents flag to be enabled.

To enable it, set \`"experimentalRunEvents": true\` in your cypress.json`)
  }

  return isFunction(event, handler)
}

const isObject = (event, handler) => {
  return validate(_.isPlainObject, handler, `The handler for the event \`${event}\` must be an object`)
}

const eventValidators = {
  'after:screenshot': isFunction,
  'before:browser:launch': isFunction,
  'file:preprocessor': isFunction,
  'task': isObject,
  '_get:task:keys': isFunction,
  '_get:task:body': isFunction,
}

const runEvents = {
  'after:run': true,
  'after:spec': true,
  'before:run': true,
  'before:spec': true,
}

const validateEvent = (event, handler, config) => {
  if (runEvents[event]) {
    return isValidRunEvent(event, handler, config)
  }

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
