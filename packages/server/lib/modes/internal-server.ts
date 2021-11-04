import os from 'os'
import { EventEmitter } from 'events'

import { makeDataContext } from '../makeDataContext'
import { makeGraphQLServer } from '../gui/makeGraphQLServer'
import { assertValidPlatform } from '@packages/types/src/platform'

export function runInternalServer (launchArgs, _internalOptions = { loadCachedProjects: true }) {
  const bus = new EventEmitter()
  const platform = os.platform()

  assertValidPlatform(platform)

  const ctx = makeDataContext({
    os: platform,
    rootBus: bus,
    launchArgs,
    _internalOptions,
  })

  // Initializing the data context, loading browsers, etc.
  ctx.initializeData()
  ctx.emitter.init()

  const serverPortPromise = makeGraphQLServer(ctx)

  return { ctx, bus, serverPortPromise }
}
