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

  reifiedError.name = serializedError?.name ?? reifiedError.name

  reifiedError.stack = $stackUtils.replacedStack(reifiedError, userInvocationStack)

  return reifiedError
}

export const serializeRunnable = (runnable) => {
  if (!runnable) return undefined

  const fields = _.pick(runnable, ['id', '_currentRetry', 'type', 'title', 'parent', 'ctx', 'titlePath'])

  fields.ctx = _.pick(runnable.ctx, ['currentTest.id', 'currentTest._currentRetry', 'currentTest.type', 'currentTest.title'])

  // recursively call serializeRunnable for the parent field
  if (fields.parent) {
    fields.titlePath = fields.titlePath()
    fields.parent = serializeRunnable(fields.parent)
  } else {
    fields.titlePath = undefined
  }

  return fields
}
