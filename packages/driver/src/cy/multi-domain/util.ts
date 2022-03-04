import _ from 'lodash'
import $stackUtils from '../../cypress/stack_utils'
import $errUtils from '../../cypress/error_utils'
import { UNSERIALIZABLE } from '../../util/serialization'

export const reifyCrossDomainError = (serializedError: any, userInvocationStack: string) => {
  // we have no idea what type the error this is... could be 'undefined', a plain old object, or something else entirely

  let reifiedError = $errUtils.errByPath('switchToDomain.failed_to_serialize_or_map_thrown_value')

  if (_.isArray(serializedError)) {
    // if the error is an array of anything, create a normal error with the stringified values of the passed in array
    reifiedError = new Error(serializedError.toString())
  } else if (_.isObject(serializedError as any)) {
    // otherwise, try to determine if there are any error details in the object and merge the error objects together
    let errorToMerge = serializedError?.message ? new Error(serializedError?.message || '') : reifiedError

    reifiedError = _.assignWith(errorToMerge, serializedError)
  } else if (serializedError !== UNSERIALIZABLE) {
    reifiedError = new Error(`${serializedError}`)
  }

  // @ts-ignore
  reifiedError.onFail = () => {}

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
