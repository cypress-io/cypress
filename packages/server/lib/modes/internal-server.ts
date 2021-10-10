import type { PlatformName } from '@packages/types'
import os from 'os'
import { EventEmitter } from 'events'

import { makeDataContext } from '../makeDataContext'
import { makeGraphQLServer } from '../gui/makeGraphQLServer'

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

const SUPPORTED_PLATFORMS = ['linux', 'darwin', 'win32'] as const

function assertValidPlatform (platform: NodeJS.Platform): asserts platform is PlatformName {
  if (!SUPPORTED_PLATFORMS.includes(platform as any)) {
    throw new Error(`Unsupported platform ${platform}, expected ${SUPPORTED_PLATFORMS.join(', ')}`)
  }
}
