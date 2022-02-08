import _ from 'lodash'
import { AssertionError } from 'chai'
import $dom from '../../dom'
import $stackUtils from '../../cypress/stack_utils'

export const correctStackForCrossDomainError = (serializedError: any, userInvocationStack: string) => {
  //  Since Errors sent over postMessage need to be serialized to Objects, we need to serialize them back into Error instances
  const ErrorClass = serializedError?.name === 'AssertionError' ? AssertionError : Error

  // only assign missing properties on the object to reify the error properly
  const reifiedError = _.assignWith(new ErrorClass(serializedError?.message), serializedError, (objValue, srcValue) => {
    return _.isUndefined(objValue) ? srcValue : objValue
  })

  reifiedError.name = serializedError?.name ?? reifiedError.name

  reifiedError.stack = $stackUtils.replacedStack(reifiedError, userInvocationStack)

  return reifiedError
}

export const omitUnserializableValues = (value) => {
  const { isDom, isDocument, isWindow, isJquery } = $dom

  // There are probably some things we aren't catching here.
  // We probably want to bubble this up to the user over a generic error to get a better idea of what couldn't be serialized
  if (isDom(value)
  || isDocument(value)
  || isWindow(value)
  || isJquery(value)
  || _.isError(value)
  || _.isFunction(value)
  || _.isSymbol(value)
  || value instanceof Promise) {
    return undefined
  }

  if (_.isArray(value)) {
    return _.map(value, omitUnserializableValues)
  }

  if (_.isObject(value)) {
    return _.mapValues(value, omitUnserializableValues)
  }

  return value
}
