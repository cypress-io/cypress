import _ from 'lodash'
import { AssertionError } from 'chai'
import $stackUtils from '../../cypress/stack_utils'

export const correctStackForCrossDomainError = (serializedError: any, userInvocationStack: string) => {
  //  Since Errors sent over postMessage need to be serialized to Objects, we need to serialize them back into Error instances
  const ErrorClass = serializedError?.name === 'AssertionError' ? AssertionError : Error

  // only assign missing properties on the object to reify the error properly
  const reifiedError = _.extend(new ErrorClass(serializedError?.message), serializedError)

  reifiedError.stack = $stackUtils.replacedStack(reifiedError, userInvocationStack)

  return reifiedError
}

export const serializeRunnable = (runnable) => {
  if (!runnable) return undefined

  const fields = _.pick(runnable, ['id', '_currentRetry', 'type', 'title', 'parent', 'ctx'])

  fields.ctx = _.pick(runnable.ctx, ['currentTest.id', 'currentTest._currentRetry', 'currentTest.type', 'currentTest.title'])

  // recursively call serializeRunnable for the parent field
  if (fields.parent) {
    fields.parent = serializeRunnable(fields.parent)
  }

  return fields
}
