import _ from 'lodash'
import type { ValidateEventResult } from './types'

const createErrorResult = (errorMessage: string): ValidateEventResult => {
  return {
    isValid: false,
    error: new Error(errorMessage),
  }
}

const createSuccessResult = (): ValidateEventResult => {
  return { isValid: true }
}

const validate = (
  func: (arg: unknown) => boolean,
  arg: unknown,
  errorMessage: string,
): ValidateEventResult => {
  return func(arg) ? createSuccessResult() : createErrorResult(errorMessage)
}

const isFunction = (event: string, handler: unknown): ValidateEventResult => {
  return validate(_.isFunction, handler, `The handler for the event \`${event}\` must be a function`)
}

const isObject = (event: string, handler: unknown): ValidateEventResult => {
  return validate(_.isPlainObject, handler, `The handler for the event \`${event}\` must be an object`)
}

type EventValidator = (event: string, handler: unknown, config?: Cypress.PluginConfigOptions) => ValidateEventResult

const eventValidators: Record<string, EventValidator> = {
  '_get:task:body': isFunction,
  '_get:task:keys': isFunction,
  '_process:cross:origin:callback': isFunction,
  'after:browser:launch': isFunction,
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

export const validateEvent = (
  event: string,
  handler: unknown,
  config?: Cypress.PluginConfigOptions,
  errConstructorFn?: () => void,
): ValidateEventResult => {
  const validator = eventValidators[event]

  if (!validator) {
    const userEvents = _.reject(_.keys(eventValidators), (registeredEvent) => {
      // we're currently not documenting after:browser:launch, so it shouldn't
      // appear in the list of valid events
      return registeredEvent.startsWith('_') || registeredEvent === 'after:browser:launch'
    })

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
