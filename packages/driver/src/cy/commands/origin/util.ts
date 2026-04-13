export const serializeRunnable = (runnable) => {
  if (!runnable) return undefined

  const fields: Record<string, any> = {
    id: runnable.id,
    type: runnable.type,
    title: runnable.title,
    _currentRetry: runnable._currentRetry,
    _timeout: runnable._timeout,
    ctx: {},
  }

  // Serialize ctx.currentTest (set in hooks) and ctx.test (set in test bodies)
  // using serializeRunnable so they get titlePath and parent chain
  if (runnable.ctx?.currentTest) {
    fields.ctx.currentTest = serializeRunnable(runnable.ctx.currentTest)
  }

  if (runnable.ctx?.test && runnable.ctx.test !== runnable) {
    fields.ctx.test = serializeRunnable(runnable.ctx.test)
  }

  // recursively call serializeRunnable for the parent field
  if (runnable.parent) {
    fields.titlePath = runnable.titlePath()
    fields.parent = serializeRunnable(runnable.parent)
  } else {
    fields.titlePath = undefined
  }

  return fields
}
