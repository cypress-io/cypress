import _ from 'lodash'
import { AssertionError } from 'chai'
import $stackUtils from '../../cypress/stack_utils'

export const correctStackForCrossDomainError = (serializedError: any, userInvocationStack: string) => {
  //  Since Errors sent over postMessage need to be serialized to Objects, we need to serialize them back into Error instances
  const ErrorClass = serializedError?.name === 'AssertionError' ? AssertionError : Error

  // only assign missing properties on the object to reify the error properly
  const reifiedError = _.assignWith(new ErrorClass(serializedError?.message), serializedError, (objValue, srcValue) => {
    return _.isUndefined(objValue) ? srcValue : objValue
  })

  reifiedError.stack = $stackUtils.replacedStack(reifiedError, userInvocationStack)

  return reifiedError
}
