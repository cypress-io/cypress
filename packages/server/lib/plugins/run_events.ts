import Bluebird from 'bluebird'

import errors from '../errors'
import plugins from '../plugins'

type Execute = (eventName: string, ...args: unknown[]) => Bluebird<Execute>

export const runEvents = {
  execute: Bluebird.method<Execute>((eventName: string, ...args: unknown[]) => {
    if (!plugins.has(eventName)) return

    return plugins.execute(eventName, ...args)
    .catch((err) => {
      err = err || {}

      errors.throw('PLUGINS_RUN_EVENT_ERROR', eventName, err.stack || err.message || err)
    })
  }),
}
