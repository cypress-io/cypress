import os from 'os'
import { EventEmitter } from 'events'

import { makeDataContext } from '../makeDataContext'
import { makeGraphQLServer } from '../gui/makeGraphQLServer'
import { assertValidPlatform } from '@packages/types/src/platform'

export function runInternalServer (options) {
  const bus = new EventEmitter()
  const platform = os.platform()

  assertValidPlatform(platform)

  const ctx = makeDataContext({
    os: platform,
    rootBus: bus,
    launchArgs: options,
  })

  // Initializing the data context, loading browsers, etc.
  ctx.initializeData()
  ctx.emitter.init()

  const serverPortPromise = makeGraphQLServer(ctx)

  serverPortPromise.then((port) => {
    ctx.setGqlServerPort(port)
  })

  return { ctx, bus, serverPortPromise }
}
