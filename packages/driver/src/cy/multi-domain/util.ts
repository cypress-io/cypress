import _ from 'lodash'
import { AssertionError } from 'chai'
import $stackUtils from '../../cypress/stack_utils'
import $dom from '../../dom'

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

export const nullifyUnserializableValues = (obj) => {
  // nullify values that cannot be cloned
  return _.cloneDeepWith(obj, (val, key) => {
    if (_.isFunction(val) || $dom.isDom(val)) {
      return null
    }

    return undefined
  })
}
