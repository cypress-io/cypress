import _ from 'lodash'

export const serializeRunnable = (runnable) => {
  if (!runnable) return undefined

  const fields = _.pick(runnable, ['id', 'type', 'title', 'parent', 'ctx', 'titlePath', '_currentRetry', '_timeout'])

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
