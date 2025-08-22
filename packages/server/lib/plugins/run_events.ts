import Promise from 'bluebird'
import * as errors from '../errors'
import * as plugins from '../plugins'

interface RunEventsAPI {
  execute: (eventName: string, ...args: any[]) => Promise<any>
}

const API: RunEventsAPI = {
  execute: Promise.method((eventName: string, ...args: any[]) => {
    if (!plugins.has(eventName)) return

    return plugins.execute(eventName, ...args)
    .catch((err: any) => {
      err = err || {}

      errors.throwErr('PLUGINS_RUN_EVENT_ERROR', eventName, err)
    })
  }),
}

export default API
