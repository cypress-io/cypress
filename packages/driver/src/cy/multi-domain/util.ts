import _ from 'lodash'
import { AssertionError } from 'chai'

export const correctStackForCrossDomainError = (serializedError: any, userInvocationStack: string) => {
  //  Since Errors sent over postMessage need to be serialized to Objects, we need to serialize them back into Error instances
  let errorClass

  switch (serializedError?.name) {
    case 'AssertionError':
      errorClass = AssertionError
      break
    default:
      errorClass = Error
  }

  // only assign missing properties on the object to reify the error properly
  const reifiedError = _.assignWith(new errorClass(serializedError?.message), serializedError, (objValue, srcValue) => {
    return _.isUndefined(objValue) ? srcValue : objValue
  })

  reifiedError.stack = userInvocationStack

  return reifiedError
}
