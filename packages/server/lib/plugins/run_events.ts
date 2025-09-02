import Promise from 'bluebird'
import * as errors from '../errors'
import * as plugins from '../plugins'

interface RunEventsAPI {
  execute: (eventName: string, ...args: unknown[]) => Promise<unknown>
}

const API: RunEventsAPI = {
  execute: Promise.method((eventName: string, ...args: unknown[]) => {
    if (!plugins.has(eventName)) return

    return plugins.execute(eventName, ...args)
    .catch((err: unknown) => {
      // Match original JavaScript behavior: err = err || {}
      const error = (err || {}) as any

      errors.throwErr('PLUGINS_RUN_EVENT_ERROR', eventName, error)
    })
  }),
}

export default API
